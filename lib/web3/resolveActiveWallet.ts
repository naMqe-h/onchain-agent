import db from "../db"

function attrString(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) return value.trim()
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
        return value[0].trim()
    }
    return null
}

export function getActiveWalletAddressFromSession(ctx: any): string | null {
    return attrString(ctx?.session?.auth?.current?.attributes?.activeWalletAddress)
}

export type ResolvedWallet = {
    id: string
    userId: string
    name: string
    address: string
    type: string
    encryptedKey: string
}

export async function resolveActingWallet(
    userId: string,
    ctx: any,
    explicitAddressOrName?: string | null
): Promise<{ ok: true; wallet: ResolvedWallet } | { ok: false; error: string }> {
    const explicit = explicitAddressOrName?.trim()

    if (explicit) {
        const wallet = await db.wallet.findFirst({
            where: {
                userId,
                OR: [
                    { address: { equals: explicit, mode: "insensitive" } },
                    { name: { equals: explicit, mode: "insensitive" } },
                ],
            },
        })

        if (!wallet) {
            return {
                ok: false,
                error: `No wallet named or with address "${explicit}" was found for your account.`,
            }
        }

        return { ok: true, wallet: wallet as ResolvedWallet }
    }

    const active = getActiveWalletAddressFromSession(ctx)
    if (!active) {
        return {
            ok: false,
            error:
                "No wallet is configured or selected for this user. The user must create or import a wallet in Settings (Wallets tab), then select it in the chat wallet selector under the input, and retry.",
        }
    }

    const wallet = await db.wallet.findFirst({
        where: {
            userId,
            address: { equals: active, mode: "insensitive" },
        },
    })

    if (!wallet) {
        return {
            ok: false,
            error:
                "The active wallet from the chat UI was not found on this account. Ask the user to re-select a wallet in the chat selector.",
        }
    }

    return { ok: true, wallet: wallet as ResolvedWallet }
}
