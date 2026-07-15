import { defineTool } from "eve/tools"
import { z } from "zod"
import { createWalletClient, createPublicClient, http, parseEther, formatEther, formatGwei } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { robinhoodTestnet } from "../../lib/web3/config"
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

export default defineTool({
    description: "Send native Ether (ETH) from a user's wallet to a specified recipient address.",
    inputSchema: z.object({
        toAddress: z.string().describe("The recipient EVM address (must start with '0x' and be 42 characters long)."),
        amount: z.string().describe("The amount of ETH to send (e.g. '0.01')."),
        fromAddressOrName: z.string().optional().describe("The EVM wallet address or custom wallet name of the sender. If omitted, and the user has exactly one wallet, that wallet will be used.")
    }),
    async execute({ toAddress, amount, fromAddressOrName }, ctx) {
        const userId = ctx.session?.auth?.current?.principalId

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
            let wallet

            if (fromAddressOrName) {
                wallet = await db.wallet.findFirst({
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
                        success: false,
                        error: `No wallet named or with address "${fromAddressOrName}" was found for your account.`
                    }
                }
            } else {
                const wallets = await db.wallet.findMany({
                    where: { userId }
                })

                if (wallets.length === 0) {
                    return {
                        success: false,
                        error: "You don't have any wallets configured in the database."
                    }
                }

                if (wallets.length > 1) {
                    return {
                        success: false,
                        error: "You have multiple wallets configured. Please specify which wallet to use by name or address."
                    }
                }

                wallet = wallets[0]
            }

            const privateKey = decryptKey(wallet.encryptedKey)

            const account = privateKeyToAccount(privateKey as `0x${string}`)
            const walletClient = createWalletClient({
                account,
                chain: robinhoodTestnet,
                transport: http()
            })
            const publicClient = createPublicClient({
                chain: robinhoodTestnet,
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
                status: receipt.status
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "An error occurred while sending the transaction."
            }
        }
    }
})
