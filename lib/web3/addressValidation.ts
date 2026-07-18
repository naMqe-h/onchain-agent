import { getAddress, isAddress } from "viem"
import db from "../db"

export function isValidEvmAddress(address: string): boolean {
    return isAddress(address, { strict: false })
}

export function normalizeEvmAddress(address: string): string {
    const trimmed = address.trim()
    if (!isValidEvmAddress(trimmed)) {
        throw new Error("Invalid EVM address")
    }
    return getAddress(trimmed)
}

export async function assertUniqueLabel(
    userId: string,
    name: string,
    options?: { excludeAddressBookEntryId?: string; excludeWalletId?: string }
): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) {
        throw new Error("Name is required")
    }

    const wallet = await db.wallet.findFirst({
        where: {
            userId,
            name: { equals: trimmed, mode: "insensitive" },
            ...(options?.excludeWalletId ? { id: { not: options.excludeWalletId } } : {}),
        },
        select: { id: true },
    })

    if (wallet) {
        throw new Error("A wallet with this name already exists")
    }

    const entry = await db.addressBookEntry.findFirst({
        where: {
            userId,
            name: { equals: trimmed, mode: "insensitive" },
            ...(options?.excludeAddressBookEntryId
                ? { id: { not: options.excludeAddressBookEntryId } }
                : {}),
        },
        select: { id: true },
    })

    if (entry) {
        throw new Error("An address book entry with this name already exists")
    }
}
