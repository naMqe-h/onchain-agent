import { defineTool } from "eve/tools"
import { z } from "zod"
import { createWalletClient, createPublicClient, http, parseEther, formatEther, formatGwei } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    getChainConfig,
    getNativeCurrencySymbol,
    normalizeNetworkId,
} from "../../lib/web3/config"
import { resolveActingWallet } from "../../lib/web3/resolveActiveWallet"
import { resolveNamedAddress } from "../../lib/web3/resolveNamedAddress"
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

export default defineTool({
    description:
        "Send native chain currency only (ETH on Robinhood/Ethereum, POL on Polygon) - not ERC-20 tokens. " +
        "Uses the user's active wallet from the chat UI selector (session) unless fromAddressOrName is explicitly provided. " +
        "Recipient (toAddress) may be a 0x address, a wallet name, or an address book name - the tool resolves names. " +
        "Sender (fromAddressOrName) must be one of the user's own wallets (private key required) - never an address book entry. " +
        "Uses the session active network. " +
        "Use when the user means native currency (ETH / POL / Ether / native) or amount+recipient with no token contract and no token ticker. " +
        "Do NOT use this tool if the user provided a token contract address (0x…) together with amount and from/to wallets - use send_erc20 instead. " +
        "Do NOT use for USDC/USDT or any ERC-20 transfer. " +
        "Whether you must confirm with the user before calling this tool is controlled by the session TX confirmation policy " +
        "(always / agent_decides / never). Read-only tools are unaffected.",
    inputSchema: z.object({
        toAddress: z.string().describe(
            "Recipient: EVM address (0x…), wallet name, or address book entry name (e.g. 'exchange', 'Mom'). The tool resolves names to addresses."
        ),
        amount: z.string().describe("The amount of native currency to send (e.g. '0.01'). Never pass an ERC-20 token amount here."),
        fromAddressOrName: z.string().optional().describe(
            "Optional override: sender wallet address or name (user's own wallet only). If omitted, uses the active wallet selected in the chat UI."
        ),
    }),
    async execute({ toAddress, amount, fromAddressOrName }, ctx) {
        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = normalizeNetworkId(
            typeof activeNetworkAttr === "string" ? activeNetworkAttr : activeNetworkAttr?.[0]
        )
        const symbol = getNativeCurrencySymbol(activeNetwork)

        if (!userId || userId === "local-dev") {
            return {
                success: false,
                error: "No authenticated database user could be identified from the session.",
            }
        }

        try {
            const recipientResult = await resolveNamedAddress(userId, toAddress)
            if (!recipientResult.ok) {
                return { success: false, error: recipientResult.error }
            }
            const recipientAddress = recipientResult.address

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
                transport: http(),
            })
            const publicClient = createPublicClient({
                chain,
                transport: http(),
            })

            const hash = await walletClient.sendTransaction({
                to: recipientAddress as `0x${string}`,
                value: parseEther(amount),
            })

            const receipt = await publicClient.waitForTransactionReceipt({ hash })

            const gasUsed = receipt.gasUsed.toString()
            const gasPriceGwei = receipt.effectiveGasPrice ? formatGwei(receipt.effectiveGasPrice) : "0"
            const gasFeeNative = formatEther(receipt.gasUsed * (receipt.effectiveGasPrice || BigInt(0)))

            return {
                success: true,
                hash,
                from: wallet.address,
                to: recipientAddress,
                amount,
                symbol,
                gasUsed,
                gasPriceGwei,
                gasFeeEth: gasFeeNative,
                gasFeeNative,
                status: receipt.status,
                network: activeNetwork,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "An error occurred while sending the transaction.",
            }
        }
    },
})
