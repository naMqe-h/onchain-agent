import { defineTool } from "eve/tools"
import { z } from "zod"
import { createWalletClient, createPublicClient, http, parseEther, type Hash } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    getChainConfig,
    getNativeCurrencySymbol,
    normalizeNetworkId,
} from "../../../lib/web3/config"
import { resolveActingWallet } from "../../../lib/web3/resolveActiveWallet"
import { resolveNamedAddress } from "../../../lib/web3/resolveNamedAddress"
import { isAddressOnAllowlist } from "../../../lib/web3/addressValidation"
import { gasFieldsFromReceipt, waitForTxReceipt } from "../../../lib/web3/waitForTx"
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
        "Send native chain currency (ETH or POL, not ERC-20). " +
        "Uses active UI wallet as sender unless fromAddressOrName is set. " +
        "toAddress can be a 0x address, wallet name, or contact name.",
    inputSchema: z.object({
        toAddress: z.string().describe("Recipient 0x address, wallet name, or contact name."),
        amount: z.string().describe("Amount of native currency to send (e.g. '0.01')."),
        fromAddressOrName: z.string().optional().describe("Optional sender wallet override."),
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

            const hash = (await walletClient.sendTransaction({
                to: recipientAddress as `0x${string}`,
                value: parseEther(amount),
            })) as Hash

            const waited = await waitForTxReceipt(publicClient, hash)

            if (waited.status === "pending") {
                return {
                    success: true,
                    hash,
                    from: wallet.address,
                    to: recipientAddress,
                    amount,
                    symbol,
                    gasUsed: null,
                    gasPriceGwei: null,
                    gasFeeEth: null,
                    gasFeeNative: null,
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
