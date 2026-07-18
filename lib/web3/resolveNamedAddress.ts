import db from "../db"
import { isValidEvmAddress, normalizeEvmAddress } from "./addressValidation"

export type NamedAddressSource = "literal" | "wallet" | "address_book"

export type ResolveNamedAddressResult =
    | { ok: true; address: string; source: NamedAddressSource; name?: string }
    | { ok: false; error: string }

export async function resolveNamedAddress(
    userId: string,
    input: string
): Promise<ResolveNamedAddressResult> {
    const trimmed = input?.trim()
    if (!trimmed) {
        return { ok: false, error: "Address or name cannot be empty." }
    }

    if (isValidEvmAddress(trimmed)) {
        try {
            return {
                ok: true,
                address: normalizeEvmAddress(trimmed),
                source: "literal",
            }
        } catch {
            return { ok: false, error: `Invalid EVM address: "${trimmed}".` }
        }
    }

    const wallet = await db.wallet.findFirst({
        where: {
            userId,
            name: { equals: trimmed, mode: "insensitive" },
        },
        select: { address: true, name: true },
    })

    if (wallet) {
        return {
            ok: true,
            address: wallet.address,
            source: "wallet",
            name: wallet.name,
        }
    }

    const entry = await db.addressBookEntry.findFirst({
        where: {
            userId,
            name: { equals: trimmed, mode: "insensitive" },
        },
        select: { address: true, name: true },
    })

    if (entry) {
        return {
            ok: true,
            address: entry.address,
            source: "address_book",
            name: entry.name,
        }
    }

    return {
        ok: false,
        error: `No wallet or address book entry named "${trimmed}" was found for your account.`,
    }
}
