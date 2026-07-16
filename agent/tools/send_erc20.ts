import { defineTool } from "eve/tools"
import { z } from "zod"
import {
    createWalletClient,
    createPublicClient,
    http,
    parseUnits,
    formatUnits,
    formatEther,
    formatGwei,
    erc20Abi,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { getChainConfig } from "../../lib/web3/config"
import db from "../../lib/db"
import { createHash, createDecipheriv } from "crypto"

const getEncryptionKey = () => {
    const secret = process.env.WALLET_ENCRYPTION_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-fallback-key-secret-1234'
    return createHash('sha256').update(secret).digest()
}

function decryptKey(encryptedText: string): string {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted key format')
    }
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const key = getEncryptionKey()
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

function isValidEvmAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
}

type WalletRow = {
    id: string
    userId: string
    address: string
    name: string
    encryptedKey: string
    type: string
}

type BalanceToken = {
    name: string
    symbol: string
    address: string
    balance: string
    decimals: number
}

async function findUserWallet(userId: string, fromAddressOrName?: string): Promise<
    | { ok: true; wallet: WalletRow }
    | { ok: false; error: string }
> {
    if (fromAddressOrName) {
        const wallet = await db.wallet.findFirst({
            where: {
                userId,
                OR: [
                    { address: { equals: fromAddressOrName.trim(), mode: 'insensitive' } },
                    { name: { equals: fromAddressOrName.trim(), mode: 'insensitive' } }
                ]
            }
        })

        if (!wallet) {
            return {
                ok: false,
                error: `No wallet named or with address "${fromAddressOrName}" was found for your account.`
            }
        }

        return { ok: true, wallet: wallet as WalletRow }
    }

    const wallets = await db.wallet.findMany({ where: { userId } })

    if (wallets.length === 0) {
        return {
            ok: false,
            error: "You don't have any wallets configured in the database."
        }
    }

    if (wallets.length > 1) {
        return {
            ok: false,
            error: "You have multiple wallets configured. Please specify which wallet to use by name or address."
        }
    }

    return { ok: true, wallet: wallets[0] as WalletRow }
}

async function resolveRecipientAddress(
    userId: string,
    toAddressOrName: string
): Promise<{ ok: true; address: string } | { ok: false; error: string }> {
    const trimmed = toAddressOrName.trim()
    if (isValidEvmAddress(trimmed)) {
        return { ok: true, address: trimmed }
    }

    const wallet = await db.wallet.findFirst({
        where: {
            userId,
            OR: [
                { address: { equals: trimmed, mode: 'insensitive' } },
                { name: { equals: trimmed, mode: 'insensitive' } }
            ]
        }
    })

    if (!wallet) {
        return {
            ok: false,
            error: `Recipient "${toAddressOrName}" is not a valid EVM address and no wallet with that name was found on your account.`
        }
    }

    return { ok: true, address: wallet.address }
}

async function fetchWalletErc20Tokens(
    walletAddress: string,
    activeNetwork: string
): Promise<{ ok: true; tokens: BalanceToken[] } | { ok: false; error: string }> {
    let url: string
    if (activeNetwork === "mainnet") {
        const apiBase = process.env.BLOCKSCOUT_API_URL_MAINNET
        const apiKey = process.env.BLOCKSCOUT_API_KEY_MAINNET
        if (!apiBase) {
            return { ok: false, error: "BLOCKSCOUT_API_URL_MAINNET is not configured." }
        }
        url = `${apiBase}/addresses/${walletAddress}/token-balances`
        if (apiKey) url += `?apikey=${apiKey}`
    } else {
        const apiBase = process.env.BLOCKSCOUT_API_URL_TESTNET
        const apiKey = process.env.BLOCKSCOUT_API_KEY_TESTNET
        if (!apiBase) {
            return { ok: false, error: "BLOCKSCOUT_API_URL_TESTNET is not configured." }
        }
        url = `${apiBase}/addresses/${walletAddress}/token-balances`
        if (apiKey) url += `?apikey=${apiKey}`
    }

    const response = await fetch(url)
    if (!response.ok) {
        return {
            ok: false,
            error: `Failed to fetch token balances from explorer API (Status: ${response.status} ${response.statusText})`
        }
    }

    const data = await response.json()
    const rawItems = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : [])

    const tokens: BalanceToken[] = rawItems
        .filter((item: any) => item?.token?.type === 'ERC-20')
        .map((item: any) => {
            const tokenInfo = item.token
            const rawValue = item.value || '0'
            const decimals = typeof tokenInfo.decimals === 'number'
                ? tokenInfo.decimals
                : parseInt(tokenInfo.decimals || '18', 10)

            let formattedBalance = '0'
            try {
                formattedBalance = formatUnits(BigInt(rawValue), decimals)
            } catch {
                formattedBalance = (Number(rawValue) / Math.pow(10, decimals)).toString()
            }

            const address = tokenInfo.address_hash || tokenInfo.address || ''
            return {
                name: tokenInfo.name || 'Unknown Token',
                symbol: tokenInfo.symbol || 'TOKEN',
                address,
                balance: formattedBalance,
                decimals
            }
        })
        .filter((t: BalanceToken) => isValidEvmAddress(t.address))

    return { ok: true, tokens }
}

function resolveTokenFromBalances(
    query: string,
    tokens: BalanceToken[]
):
    | { ok: true; token: BalanceToken }
    | { ok: false; error: string; candidates?: BalanceToken[] } {
    const q = query.trim().toLowerCase()

    const symbolExact = tokens.filter(t => t.symbol.toLowerCase() === q)
    if (symbolExact.length === 1) {
        return { ok: true, token: symbolExact[0] }
    }
    if (symbolExact.length > 1) {
        return {
            ok: false,
            error: `Multiple tokens match symbol "${query}". Specify the contract address.`,
            candidates: symbolExact
        }
    }

    const nameExact = tokens.filter(t => t.name.toLowerCase() === q)
    if (nameExact.length === 1) {
        return { ok: true, token: nameExact[0] }
    }
    if (nameExact.length > 1) {
        return {
            ok: false,
            error: `Multiple tokens match name "${query}". Specify the contract address.`,
            candidates: nameExact
        }
    }

    const namePartial = tokens.filter(t =>
        t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q)
    )
    if (namePartial.length === 1) {
        return { ok: true, token: namePartial[0] }
    }
    if (namePartial.length > 1) {
        return {
            ok: false,
            error: `Multiple tokens partially match "${query}". Specify the contract address or a more exact symbol.`,
            candidates: namePartial
        }
    }

    const available = tokens.map(t => `${t.symbol} (${t.name})`).join(', ')
    return {
        ok: false,
        error: `No ERC-20 token matching "${query}" was found in the sender wallet balances.${available ? ` Available: ${available}` : ' The wallet has no ERC-20 token balances on the active network.'}`
    }
}

export default defineTool({
    description:
        "Send an ERC-20 token (not native ETH) from a user wallet. " +
        "Pass token as either a contract address (0x…) OR a ticker/name held on the sender wallet (e.g. USDC, USDT, or any other symbol/name the user provides). " +
        "When a ticker/name is passed, this tool automatically loads the sender's ERC-20 balances and resolves the contract — no prior get_token_balances call is required. " +
        "Any user-provided ticker/name may be a valid ERC-20 on this chain if it appears in the wallet balances; do not refuse based on off-chain assumptions. " +
        "Recipient may be a 0x address or a wallet name. Uses session active network. Never use send_eth for these transfers.",
    inputSchema: z.object({
        token: z.string().describe(
            "ERC-20 contract address (0x…) OR token ticker/name as the user said it (e.g. 'USDC', 'USDT', or any other symbol/name). " +
            "Do not refuse tickers based on off-chain assumptions — resolve them against the sender wallet balances."
        ),
        toAddress: z.string().describe(
            "Recipient EVM address (0x…) or the recipient wallet name (e.g. 'secondary', 'secondary wallet')."
        ),
        amount: z.string().describe("Amount of tokens in human-readable units (e.g. '2' or '10.5'), not raw wei."),
        fromAddressOrName: z.string().optional().describe(
            "Sender wallet address or name (e.g. 'primary'). Required if the user has multiple wallets."
        ),
    }),
    async execute({ token, toAddress, amount, fromAddressOrName }, ctx) {
        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = (typeof activeNetworkAttr === 'string' ? activeNetworkAttr : activeNetworkAttr?.[0]) || "testnet"

        if (!userId || userId === "local-dev") {
            return {
                success: false,
                error: "No authenticated database user could be identified from the session."
            }
        }

        const tokenQuery = token.trim()
        if (!tokenQuery) {
            return { success: false, error: "Token parameter cannot be empty." }
        }

        try {
            const walletResult = await findUserWallet(userId, fromAddressOrName)
            if (!walletResult.ok) {
                return { success: false, error: walletResult.error }
            }
            const wallet = walletResult.wallet

            const recipientResult = await resolveRecipientAddress(userId, toAddress)
            if (!recipientResult.ok) {
                return { success: false, error: recipientResult.error }
            }
            const recipientAddress = recipientResult.address

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
                    const candidateHint = match.candidates?.map(
                        t => `${t.symbol} (${t.name}): ${t.address} balance=${t.balance}`
                    ).join('; ')
                    return {
                        success: false,
                        error: candidateHint ? `${match.error} Candidates: ${candidateHint}` : match.error,
                        availableTokens: balances.tokens.map(t => ({
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
                transport: http()
            })
            const publicClient = createPublicClient({
                chain,
                transport: http()
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
                    error: "Failed to read token decimals. Ensure the address is a valid ERC-20 contract on the active network."
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
                    error: `Invalid amount "${amount}". Provide a valid human-readable number (e.g. '10.5').`
                }
            }

            if (parsedAmount <= BigInt(0)) {
                return {
                    success: false,
                    error: "Amount must be greater than zero."
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
                    error: `Insufficient token balance. Available: ${formatUnits(balance, decimals)}${tokenSymbol ? ` ${tokenSymbol}` : ""}, requested: ${amount}${tokenSymbol ? ` ${tokenSymbol}` : ""}.`
                }
            }

            const hash = await walletClient.writeContract({
                address: tokenAddr,
                abi: erc20Abi,
                functionName: "transfer",
                args: [recipient, parsedAmount],
            })

            const receipt = await publicClient.waitForTransactionReceipt({ hash })

            const gasUsed = receipt.gasUsed.toString()
            const gasPriceGwei = receipt.effectiveGasPrice ? formatGwei(receipt.effectiveGasPrice) : "0"
            const gasFeeEth = formatEther(receipt.gasUsed * (receipt.effectiveGasPrice || BigInt(0)))

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
                gasFeeEth,
                status: receipt.status,
                network: activeNetwork,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "An error occurred while sending the ERC-20 transfer."
            }
        }
    }
})
