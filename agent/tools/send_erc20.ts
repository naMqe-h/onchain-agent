import { defineTool } from "eve/tools"
import { z } from "zod"
import {
    createWalletClient,
    createPublicClient,
    http,
    parseUnits,
    formatUnits,
    erc20Abi,
    type Hash,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    getChainConfig,
    getNativeCurrencySymbol,
    normalizeNetworkId,
} from "../../lib/web3/config"
import { resolveActingWallet } from "../../lib/web3/resolveActiveWallet"
import { resolveNamedAddress } from "../../lib/web3/resolveNamedAddress"
import { isAddressOnAllowlist } from "../../lib/web3/addressValidation"
import { fetchWalletErc20Tokens, type BalanceToken } from "../../lib/web3/tokenBalances"
import { gasFieldsFromReceipt, waitForTxReceipt } from "../../lib/web3/waitForTx"
import { createHash, createDecipheriv } from "crypto"

const getEncryptionKey = () => {
    const secret = process.env.WALLET_ENCRYPTION_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "default-fallback-key-secret-1234"
    return createHash("sha256").update(secret).digest()
}

function decryptKey(encryptedText: string): string {
    const parts = encryptedText.split(":")
    if (parts.length !== 2) {
        throw new Error("Invalid encrypted key format")
    }
    const iv = Buffer.from(parts[0], "hex")
    const encrypted = parts[1]
    const key = getEncryptionKey()
    const decipher = createDecipheriv("aes-256-cbc", key, iv)
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
}

function isValidEvmAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
}

function resolveTokenFromBalances(
    query: string,
    tokens: BalanceToken[]
):
    | { ok: true; token: BalanceToken }
    | { ok: false; error: string; candidates?: BalanceToken[] } {
    const q = query.trim().toLowerCase()

    const symbolExact = tokens.filter((t) => t.symbol.toLowerCase() === q)
    if (symbolExact.length === 1) {
        return { ok: true, token: symbolExact[0] }
    }
    if (symbolExact.length > 1) {
        return {
            ok: false,
            error: `Multiple tokens match symbol "${query}". Specify the contract address.`,
            candidates: symbolExact,
        }
    }

    const nameExact = tokens.filter((t) => t.name.toLowerCase() === q)
    if (nameExact.length === 1) {
        return { ok: true, token: nameExact[0] }
    }
    if (nameExact.length > 1) {
        return {
            ok: false,
            error: `Multiple tokens match name "${query}". Specify the contract address.`,
            candidates: nameExact,
        }
    }

    const namePartial = tokens.filter(
        (t) => t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q)
    )
    if (namePartial.length === 1) {
        return { ok: true, token: namePartial[0] }
    }
    if (namePartial.length > 1) {
        return {
            ok: false,
            error: `Multiple tokens partially match "${query}". Specify the contract address or a more exact symbol.`,
            candidates: namePartial,
        }
    }

    const available = tokens.map((t) => `${t.symbol} (${t.name})`).join(", ")
    return {
        ok: false,
        error: `No ERC-20 token matching "${query}" was found in the sender wallet balances.${available ? ` Available: ${available}` : " The wallet has no ERC-20 token balances on the active network."}`,
    }
}

export default defineTool({
    description:
        "Send an ERC-20 token (not native ETH/POL) from a user wallet on the session active network. " +
        "Pass token as either a contract address (0x…) OR a ticker/name held on the sender wallet (e.g. USDC, USDT, or any other symbol/name the user provides). " +
        "When a ticker/name is passed, this tool automatically loads the sender's ERC-20 balances and resolves the contract - no prior get_token_balances call is required. " +
        "Any user-provided ticker/name may be a valid ERC-20 on this chain if it appears in the wallet balances; do not refuse based on off-chain assumptions. " +
        "Uses the chat UI active wallet as sender unless fromAddressOrName is set. " +
        "Recipient may be a 0x address, a wallet name, or an address book name (tool resolves names). " +
        "Sender must be one of the user's own wallets - never an address book entry. " +
        "Never use send_native for these transfers. " +
        "Whether you must confirm with the user before calling this tool is controlled by the session TX confirmation policy " +
        "(always / agent_decides / never). Read-only tools are unaffected.",
    inputSchema: z.object({
        token: z.string().describe(
            "ERC-20 contract address (0x…) OR token ticker/name as the user said it (e.g. 'USDC', 'USDT', or any other symbol/name). " +
            "Do not refuse tickers based on off-chain assumptions - resolve them against the sender wallet balances."
        ),
        toAddress: z.string().describe(
            "Recipient: EVM address (0x…), wallet name, or address book entry name (e.g. 'secondary', 'exchange', 'Mom')."
        ),
        amount: z.string().describe("Amount of tokens in human-readable units (e.g. '2' or '10.5'), not raw wei."),
        fromAddressOrName: z.string().optional().describe(
            "Optional sender override (user wallet address or name only). If omitted, uses the active wallet selected in the chat UI."
        ),
    }),
    async execute({ token, toAddress, amount, fromAddressOrName }, ctx) {
        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = normalizeNetworkId(
            typeof activeNetworkAttr === "string" ? activeNetworkAttr : activeNetworkAttr?.[0]
        )
        const nativeSymbol = getNativeCurrencySymbol(activeNetwork)

        if (!userId || userId === "local-dev") {
            return {
                success: false,
                error: "No authenticated database user could be identified from the session.",
            }
        }

        const tokenQuery = token.trim()
        if (!tokenQuery) {
            return { success: false, error: "Token parameter cannot be empty." }
        }

        try {
            const walletResult = await resolveActingWallet(userId, ctx, fromAddressOrName)
            if (!walletResult.ok) {
                return { success: false, error: walletResult.error }
            }
            const wallet = walletResult.wallet

            const recipientResult = await resolveNamedAddress(userId, toAddress)
            if (!recipientResult.ok) {
                return { success: false, error: recipientResult.error }
            }
            const recipientAddress = recipientResult.address

            const addressAllowlistEnabled = ctx.session?.auth?.current?.attributes?.addressAllowlistEnabled === "true"
            if (addressAllowlistEnabled) {
                const allowed = await isAddressOnAllowlist(userId, recipientAddress)
                if (!allowed) {
                    return {
                        success: false,
                        error: "Address Allowlist security check failed: The recipient address is not in your address book or wallets list. To send to this address, add it to your Address Book in Settings, or disable this safety check in Settings -> Security."
                    }
                }
            }

            let resolvedTokenAddress: string
            let resolvedFromBalances = false

            if (isValidEvmAddress(tokenQuery)) {
                resolvedTokenAddress = tokenQuery
            } else {
                const balances = await fetchWalletErc20Tokens(wallet.address, activeNetwork)
                if (!balances.ok) {
                    return { success: false, error: balances.error }
                }

                const match = resolveTokenFromBalances(tokenQuery, balances.tokens)
                if (!match.ok) {
                    const candidateHint = match.candidates
                        ?.map((t) => `${t.symbol} (${t.name}): ${t.address} balance=${t.balance}`)
                        .join("; ")
                    return {
                        success: false,
                        error: candidateHint ? `${match.error} Candidates: ${candidateHint}` : match.error,
                        availableTokens: balances.tokens.map((t) => ({
                            symbol: t.symbol,
                            name: t.name,
                            address: t.address,
                            balance: t.balance,
                        })),
                    }
                }

                resolvedTokenAddress = match.token.address
                resolvedFromBalances = true
            }

            const privateKey = decryptKey(wallet.encryptedKey)
            const account = privateKeyToAccount(privateKey as `0x${string}`)
            const chain = getChainConfig(activeNetwork)
            const walletClient = createWalletClient({
                account,
                chain,
                transport: http(),
            })
            const publicClient = createPublicClient({
                chain,
                transport: http(),
            })

            const tokenAddr = resolvedTokenAddress as `0x${string}`
            const recipient = recipientAddress as `0x${string}`
            const owner = wallet.address as `0x${string}`

            let decimals: number
            try {
                decimals = await publicClient.readContract({
                    address: tokenAddr,
                    abi: erc20Abi,
                    functionName: "decimals",
                })
            } catch {
                return {
                    success: false,
                    error: "Failed to read token decimals. Ensure the address is a valid ERC-20 contract on the active network.",
                }
            }

            let tokenSymbol: string | undefined
            try {
                tokenSymbol = await publicClient.readContract({
                    address: tokenAddr,
                    abi: erc20Abi,
                    functionName: "symbol",
                })
            } catch {
                tokenSymbol = undefined
            }

            let parsedAmount: bigint
            try {
                parsedAmount = parseUnits(amount, decimals)
            } catch {
                return {
                    success: false,
                    error: `Invalid amount "${amount}". Provide a valid human-readable number (e.g. '10.5').`,
                }
            }

            if (parsedAmount <= BigInt(0)) {
                return {
                    success: false,
                    error: "Amount must be greater than zero.",
                }
            }

            const balance = await publicClient.readContract({
                address: tokenAddr,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [owner],
            })

            if (balance < parsedAmount) {
                return {
                    success: false,
                    error: `Insufficient token balance. Available: ${formatUnits(balance, decimals)}${tokenSymbol ? ` ${tokenSymbol}` : ""}, requested: ${amount}${tokenSymbol ? ` ${tokenSymbol}` : ""}.`,
                }
            }

            const hash = (await walletClient.writeContract({
                address: tokenAddr,
                abi: erc20Abi,
                functionName: "transfer",
                args: [recipient, parsedAmount],
            })) as Hash

            const waited = await waitForTxReceipt(publicClient, hash)

            if (waited.status === "pending") {
                return {
                    success: true,
                    hash,
                    from: wallet.address,
                    to: recipientAddress,
                    tokenAddress: resolvedTokenAddress,
                    tokenSymbol: tokenSymbol || null,
                    tokenQuery,
                    resolvedFromBalances,
                    amount,
                    decimals,
                    gasUsed: null,
                    gasPriceGwei: null,
                    gasFeeEth: null,
                    gasFeeNative: null,
                    nativeSymbol,
                    status: "pending",
                    pendingReason: waited.reason,
                    network: activeNetwork,
                }
            }

            const receipt = waited.receipt
            const { gasUsed, gasPriceGwei, gasFeeNative } = gasFieldsFromReceipt(receipt)

            return {
                success: true,
                hash,
                from: wallet.address,
                to: recipientAddress,
                tokenAddress: resolvedTokenAddress,
                tokenSymbol: tokenSymbol || null,
                tokenQuery,
                resolvedFromBalances,
                amount,
                decimals,
                gasUsed,
                gasPriceGwei,
                gasFeeEth: gasFeeNative,
                gasFeeNative,
                nativeSymbol,
                status: receipt.status,
                network: activeNetwork,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "An error occurred while sending the ERC-20 transfer.",
            }
        }
    },
})
