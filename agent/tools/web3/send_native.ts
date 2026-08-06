import { defineTool } from "eve/tools"
import { z } from "zod"
import { parseEther, type Hash } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { getPublicClient, getWalletClient } from "../../../lib/web3/providers"
import {
    getNativeCurrencySymbol,
    normalizeNetworkId,
} from "../../../lib/web3/config"
import { resolveActingWallet } from "../../../lib/web3/resolveActiveWallet"
import { resolveNamedAddress } from "../../../lib/web3/resolveNamedAddress"
import { isAddressOnAllowlist } from "../../../lib/web3/addressValidation"
import { gasFieldsFromReceipt, waitForTxReceipt } from "../../../lib/web3/waitForTx"
import { decryptWalletKey } from "../../../lib/web3/walletCrypto"

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

            const privateKey = decryptWalletKey(wallet)

            const account = privateKeyToAccount(privateKey as `0x${string}`)
            const walletClient = getWalletClient(account, activeNetwork)
            const publicClient = getPublicClient(activeNetwork)

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
