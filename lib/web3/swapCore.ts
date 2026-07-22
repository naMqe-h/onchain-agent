import {
    createPublicClient,
    createWalletClient,
    erc20Abi,
    formatUnits,
    http,
    parseUnits,
    type Hash,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    getChainConfig,
    getChainId,
    getNativeCurrencySymbol,
    getNetworkLabel,
    isUniswapSwapSupported,
    type NetworkId,
} from "./config"
import { resolveToken, type ResolvedToken } from "./resolveToken"
import {
    checkApproval,
    createSwap,
    getInputAmountRaw,
    getOutputAmountRaw,
    getQuote,
    isNativeTokenAddress,
    NATIVE_TOKEN_ADDRESS,
    validateSwapTransaction,
} from "./uniswap/client"
import type { QuoteResponse } from "./uniswap/types"
import { decryptWalletKey } from "./walletCrypto"
import {
    gasFieldsFromReceipt,
    waitForTxReceipt,
} from "./waitForTx"

export const DEFAULT_SLIPPAGE = 0.5
export const MAX_SLIPPAGE = 5

export function clampSlippage(raw?: number): number {
    if (raw === undefined || raw === null || Number.isNaN(raw)) {
        return DEFAULT_SLIPPAGE
    }
    if (raw <= 0) return DEFAULT_SLIPPAGE
    if (raw > MAX_SLIPPAGE) return MAX_SLIPPAGE
    return Math.round(raw * 100) / 100
}

export function parseHumanAmount(
    amount: string,
    decimals: number
): { ok: true; value: bigint } | { ok: false; error: string } {
    const trimmed = amount.trim()
    if (!trimmed || !/^[0-9]+(\.[0-9]+)?$/.test(trimmed)) {
        return {
            ok: false,
            error: `Invalid amount "${amount}". Provide a non-negative number (e.g. '0.001' or '10.5').`,
        }
    }
    try {
        const value = parseUnits(trimmed, decimals)
        if (value <= BigInt(0)) {
            return { ok: false, error: "Amount must be greater than zero." }
        }
        return { ok: true, value }
    } catch {
        return {
            ok: false,
            error: `Invalid amount "${amount}" for token decimals ${decimals}.`,
        }
    }
}

export type PreparedSwapContext = {
    network: NetworkId
    chainId: number
    walletAddress: string
    encryptedKey: string
    tokenIn: ResolvedToken
    tokenOut: ResolvedToken
    amountHuman: string
    amountRaw: string
    amountRawBigInt: bigint
    slippageTolerance: number
}

export async function prepareSwapContext(params: {
    network: NetworkId
    walletAddress: string
    encryptedKey: string
    tokenInQuery: string
    tokenOutQuery: string
    amount: string
    slippageTolerance?: number
    userId?: string
}): Promise<
    | { ok: true; ctx: PreparedSwapContext }
    | { ok: false; error: string; candidates?: unknown }
> {
    if (!isUniswapSwapSupported(params.network)) {
        return {
            ok: false,
            error:
                `Uniswap swaps are not available on ${getNetworkLabel(params.network)}. ` +
                `Switch to Ethereum, Ethereum Sepolia, Polygon, or Robinhood in Settings → Network.`,
        }
    }

    const slippageTolerance = clampSlippage(params.slippageTolerance)

    const tokenInResult = await resolveToken({
        query: params.tokenInQuery,
        network: params.network,
        walletAddress: params.walletAddress,
        role: "in",
        userId: params.userId,
    })
    if (!tokenInResult.ok) {
        return {
            ok: false,
            error: tokenInResult.error,
            candidates: tokenInResult.candidates,
        }
    }

    const tokenOutResult = await resolveToken({
        query: params.tokenOutQuery,
        network: params.network,
        walletAddress: params.walletAddress,
        role: "out",
        userId: params.userId,
    })
    if (!tokenOutResult.ok) {
        return {
            ok: false,
            error: tokenOutResult.error,
            candidates: tokenOutResult.candidates,
        }
    }

    const tokenIn = tokenInResult.token
    const tokenOut = tokenOutResult.token

    if (tokenIn.address.toLowerCase() === tokenOut.address.toLowerCase()) {
        return {
            ok: false,
            error: "tokenIn and tokenOut must be different tokens.",
        }
    }

    const parsed = parseHumanAmount(params.amount, tokenIn.decimals)
    if (!parsed.ok) return parsed

    return {
        ok: true,
        ctx: {
            network: params.network,
            chainId: getChainId(params.network),
            walletAddress: params.walletAddress,
            encryptedKey: params.encryptedKey,
            tokenIn,
            tokenOut,
            amountHuman: params.amount.trim(),
            amountRaw: parsed.value.toString(),
            amountRawBigInt: parsed.value,
            slippageTolerance,
        },
    }
}

export async function assertSufficientBalance(
    ctx: PreparedSwapContext
): Promise<{ ok: true } | { ok: false; error: string }> {
    const publicClient = createPublicClient({
        chain: getChainConfig(ctx.network),
        transport: http(),
    })
    const owner = ctx.walletAddress as `0x${string}`

    if (ctx.tokenIn.isNative || isNativeTokenAddress(ctx.tokenIn.address)) {
        const balance = await publicClient.getBalance({ address: owner })
        if (balance < ctx.amountRawBigInt) {
            return {
                ok: false,
                error: `Insufficient ${ctx.tokenIn.symbol} balance. Available: ${formatUnits(balance, 18)}, requested: ${ctx.amountHuman}.`,
            }
        }
        return { ok: true }
    }

    const balance = await publicClient.readContract({
        address: ctx.tokenIn.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [owner],
    })
    if (balance < ctx.amountRawBigInt) {
        return {
            ok: false,
            error: `Insufficient ${ctx.tokenIn.symbol} balance. Available: ${formatUnits(balance, ctx.tokenIn.decimals)}, requested: ${ctx.amountHuman}.`,
        }
    }
    return { ok: true }
}

function formatAmountOut(
    raw: string | null,
    token: ResolvedToken
): string | null {
    if (!raw) return null
    try {
        return formatUnits(BigInt(raw), token.decimals)
    } catch {
        return null
    }
}

export function summarizeQuote(
    ctx: PreparedSwapContext,
    quoteResponse: QuoteResponse
) {
    const outRaw = getOutputAmountRaw(quoteResponse)
    const inRaw = getInputAmountRaw(quoteResponse) ?? ctx.amountRaw
    return {
        routing: quoteResponse.routing,
        amountIn: formatUnits(BigInt(inRaw), ctx.tokenIn.decimals),
        amountInRaw: inRaw,
        amountOut: formatAmountOut(outRaw, ctx.tokenOut),
        amountOutRaw: outRaw,
        gasFeeUSD:
            typeof quoteResponse.quote?.gasFeeUSD === "string"
                ? quoteResponse.quote.gasFeeUSD
                : null,
        gasUseEstimate:
            typeof quoteResponse.quote?.gasUseEstimate === "string"
                ? quoteResponse.quote.gasUseEstimate
                : null,
        slippageTolerance: ctx.slippageTolerance,
    }
}

export async function fetchSwapQuote(ctx: PreparedSwapContext) {
    const quoteResponse = await getQuote({
        tokenIn: ctx.tokenIn.isNative
            ? NATIVE_TOKEN_ADDRESS
            : ctx.tokenIn.address,
        tokenOut: ctx.tokenOut.isNative
            ? NATIVE_TOKEN_ADDRESS
            : ctx.tokenOut.address,
        amount: ctx.amountRaw,
        swapper: ctx.walletAddress,
        chainId: ctx.chainId,
        slippageTolerance: ctx.slippageTolerance,
        network: ctx.network,
        protocols: ["V2", "V3", "V4"],
    })

    return {
        quoteResponse,
        summary: summarizeQuote(ctx, quoteResponse),
    }
}

function createClients(ctx: PreparedSwapContext) {
    const privateKey = decryptWalletKey(ctx.encryptedKey)
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    const chain = getChainConfig(ctx.network)
    const walletClient = createWalletClient({
        account,
        chain,
        transport: http(),
    })
    const publicClient = createPublicClient({
        chain,
        transport: http(),
    })
    return { account, walletClient, publicClient }
}

async function sendBuiltTx(
    walletClient: ReturnType<typeof createWalletClient>,
    publicClient: ReturnType<typeof createPublicClient>,
    tx: {
        to: string
        data: string
        value?: string
        gasLimit?: string
        maxFeePerGas?: string
        maxPriorityFeePerGas?: string
        gasPrice?: string
    },
    waitOptions?: { timeoutMs?: number }
) {
    const hash = (await walletClient.sendTransaction({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value || "0"),
        ...(tx.gasLimit ? { gas: BigInt(tx.gasLimit) } : {}),
        ...(tx.maxFeePerGas ? { maxFeePerGas: BigInt(tx.maxFeePerGas) } : {}),
        ...(tx.maxPriorityFeePerGas
            ? { maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas) }
            : {}),
        ...(tx.gasPrice && !tx.maxFeePerGas
            ? { gasPrice: BigInt(tx.gasPrice) }
            : {}),
    } as any)) as Hash

    const waited = await waitForTxReceipt(publicClient, hash, waitOptions)
    return { hash, waited }
}

export async function executeSwap(ctx: PreparedSwapContext) {
    const balanceCheck = await assertSufficientBalance(ctx)
    if (!balanceCheck.ok) {
        return { success: false as const, error: balanceCheck.error }
    }

    const { account, walletClient, publicClient } = createClients(ctx)
    let approvalHash: string | null = null

    if (!ctx.tokenIn.isNative && !isNativeTokenAddress(ctx.tokenIn.address)) {
        const approvalRes = await checkApproval({
            walletAddress: ctx.walletAddress,
            token: ctx.tokenIn.address,
            amount: ctx.amountRaw,
            chainId: ctx.chainId,
            network: ctx.network,
        })

        if (approvalRes.approval) {
            validateSwapTransaction(approvalRes.approval)
            const { hash, waited } = await sendBuiltTx(
                walletClient,
                publicClient,
                approvalRes.approval,
                { timeoutMs: 90_000 }
            )
            approvalHash = hash
            if (waited.status === "confirmed" && waited.receipt.status === "reverted") {
                return {
                    success: false as const,
                    error: "Token approval transaction reverted.",
                    approvalHash,
                }
            }
            if (waited.status === "pending") {
                return {
                    success: false as const,
                    error:
                        "Token approval was submitted but not confirmed in time. " +
                        "Wait for the approval tx to confirm on the explorer, then retry the swap.",
                    approvalHash,
                    status: "pending",
                    pendingReason: waited.reason,
                    network: ctx.network,
                }
            }
        }
    }

    const { quoteResponse, summary } = await fetchSwapQuote(ctx)

    let signature: string | undefined
    const permitData = quoteResponse.permitData
    if (permitData && typeof permitData === "object") {
        const domain = permitData.domain as {
            name?: string
            version?: string
            chainId?: number | string
            verifyingContract?: `0x${string}`
            salt?: `0x${string}`
        }
        const primaryType =
            (permitData.primaryType as string) ||
            (Object.keys(permitData.types || {}).find(
                (k) => k !== "EIP712Domain"
            ) as string)

        signature = await walletClient.signTypedData({
            account,
            domain: {
                ...(domain.name ? { name: domain.name } : {}),
                ...(domain.version ? { version: domain.version } : {}),
                ...(domain.chainId !== undefined
                    ? { chainId: Number(domain.chainId) }
                    : {}),
                ...(domain.verifyingContract
                    ? { verifyingContract: domain.verifyingContract }
                    : {}),
                ...(domain.salt ? { salt: domain.salt } : {}),
            },
            types: permitData.types as Record<
                string,
                Array<{ name: string; type: string }>
            >,
            primaryType,
            message: permitData.values as Record<string, unknown>,
        } as any)
    }

    const swapRes = await createSwap(quoteResponse, ctx.network, signature)
    validateSwapTransaction(swapRes.swap)

    const { hash, waited } = await sendBuiltTx(
        walletClient,
        publicClient,
        swapRes.swap
    )

    const nativeSymbol = getNativeCurrencySymbol(ctx.network)

    if (waited.status === "pending") {
        return {
            success: true as const,
            hash,
            approvalHash,
            from: ctx.walletAddress,
            tokenIn: {
                address: ctx.tokenIn.address,
                symbol: ctx.tokenIn.symbol,
                name: ctx.tokenIn.name,
                decimals: ctx.tokenIn.decimals,
                isNative: ctx.tokenIn.isNative,
            },
            tokenOut: {
                address: ctx.tokenOut.address,
                symbol: ctx.tokenOut.symbol,
                name: ctx.tokenOut.name,
                decimals: ctx.tokenOut.decimals,
                isNative: ctx.tokenOut.isNative,
            },
            amountIn: summary.amountIn,
            amountInRaw: summary.amountInRaw,
            amountOut: summary.amountOut,
            amountOutRaw: summary.amountOutRaw,
            slippageTolerance: ctx.slippageTolerance,
            routing: summary.routing,
            gasUsed: null,
            gasPriceGwei: null,
            gasFeeEth: null,
            gasFeeNative: null,
            gasFeeUSD: summary.gasFeeUSD,
            nativeSymbol,
            status: "pending",
            pendingReason: waited.reason,
            network: ctx.network,
        }
    }

    const receipt = waited.receipt
    if (receipt.status === "reverted") {
        return {
            success: false as const,
            error: "Swap transaction was mined but reverted.",
            hash,
            approvalHash,
            network: ctx.network,
        }
    }

    const { gasUsed, gasPriceGwei, gasFeeNative } = gasFieldsFromReceipt(receipt)

    return {
        success: true as const,
        hash,
        approvalHash,
        from: ctx.walletAddress,
        tokenIn: {
            address: ctx.tokenIn.address,
            symbol: ctx.tokenIn.symbol,
            name: ctx.tokenIn.name,
            decimals: ctx.tokenIn.decimals,
            isNative: ctx.tokenIn.isNative,
        },
        tokenOut: {
            address: ctx.tokenOut.address,
            symbol: ctx.tokenOut.symbol,
            name: ctx.tokenOut.name,
            decimals: ctx.tokenOut.decimals,
            isNative: ctx.tokenOut.isNative,
        },
        amountIn: summary.amountIn,
        amountInRaw: summary.amountInRaw,
        amountOut: summary.amountOut,
        amountOutRaw: summary.amountOutRaw,
        slippageTolerance: ctx.slippageTolerance,
        routing: summary.routing,
        gasUsed,
        gasPriceGwei,
        gasFeeEth: gasFeeNative,
        gasFeeNative,
        gasFeeUSD: summary.gasFeeUSD,
        nativeSymbol,
        status: receipt.status,
        network: ctx.network,
    }
}
