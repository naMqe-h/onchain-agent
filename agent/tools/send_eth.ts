import { defineTool } from "eve/tools"
import { z } from "zod"
import { createWalletClient, createPublicClient, http, parseEther, formatEther, formatGwei } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { getChainConfig } from "../../lib/web3/config"
import { resolveActingWallet } from "../../lib/web3/resolveActiveWallet"
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

export default defineTool({
    description:
        "Send native Ether (ETH) only - not ERC-20 tokens. " +
        "Uses the user's active wallet from the chat UI selector (session) unless fromAddressOrName is explicitly provided. " +
        "Use when the user explicitly means ETH/Ether/native currency, or amount+recipient with no token contract and no token ticker. " +
        "Do NOT use this tool if the user provided a token contract address (0x…) together with amount and from/to wallets - use send_erc20 instead. " +
        "Do NOT use for USDC/USDT or any ERC-20 transfer.",
    inputSchema: z.object({
        toAddress: z.string().describe("The recipient EVM address (must start with '0x' and be 42 characters long). Resolve wallet names to addresses first."),
        amount: z.string().describe("The amount of native ETH to send (e.g. '0.01'). Never pass an ERC-20 token amount here."),
        fromAddressOrName: z.string().optional().describe("Optional override: sender wallet address or name. If omitted, uses the active wallet selected in the chat UI.")
    }),
    async execute({ toAddress, amount, fromAddressOrName }, ctx) {
        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = (typeof activeNetworkAttr === 'string' ? activeNetworkAttr : activeNetworkAttr?.[0]) || "testnet"

        if (!userId || userId === "local-dev") {
            return {
                success: false,
                error: "No authenticated database user could be identified from the session."
            }
        }

        if (!toAddress.startsWith('0x') || toAddress.length !== 42) {
            return {
                success: false,
                error: "Invalid recipient address format. It must start with '0x' and be 42 characters long."
            }
        }

        try {
            const resolved = await resolveActingWallet(userId, ctx, fromAddressOrName)
            if (!resolved.ok) {
                return { success: false, error: resolved.error }
            }
            const wallet = resolved.wallet

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

            const hash = await walletClient.sendTransaction({
                to: toAddress as `0x${string}`,
                value: parseEther(amount)
            })

            const receipt = await publicClient.waitForTransactionReceipt({ hash })

            const gasUsed = receipt.gasUsed.toString()
            const gasPriceGwei = receipt.effectiveGasPrice ? formatGwei(receipt.effectiveGasPrice) : "0"
            const gasFeeEth = formatEther(receipt.gasUsed * (receipt.effectiveGasPrice || BigInt(0)))

            return {
                success: true,
                hash,
                from: wallet.address,
                to: toAddress,
                amount,
                gasUsed,
                gasPriceGwei,
                gasFeeEth,
                status: receipt.status,
                network: activeNetwork,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "An error occurred while sending the transaction."
            }
        }
    }
})
