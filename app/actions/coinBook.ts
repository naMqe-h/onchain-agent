'use server'

import { PublicCoinBookEntry } from '@/types'
import db from '../../lib/db'
import { createClient } from '../../lib/supabase/server'
import { getDexScreenerChainIds } from '../../lib/web3/config'


async function requireUser() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    return { supabase, user }
}

function toPublic(entry: {
    id: string
    name: string
    symbol: string
    address: string
    chain: string
    imageUrl: string | null
}): PublicCoinBookEntry {
    return {
        id: entry.id,
        name: entry.name,
        symbol: entry.symbol,
        address: entry.address,
        chain: entry.chain,
        imageUrl: entry.imageUrl,
    }
}

export async function listCoinBook(): Promise<PublicCoinBookEntry[]> {
    const { user } = await requireUser()

    const entries = await db.coinBookEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            name: true,
            symbol: true,
            address: true,
            chain: true,
            imageUrl: true,
        },
    })

    return entries.map(toPublic)
}

function getMatchingDexScreenerChainIds(chain: string): string[] {
    const chainLower = chain.trim().toLowerCase()
    try {
        const dexIds = getDexScreenerChainIds(chainLower)
        if (dexIds && dexIds.length > 0) {
            return dexIds.map((id) => id.toLowerCase())
        }
    } catch {
        // fallback
    }
    return [chainLower]
}

export async function createCoinBookEntry(
    address: string,
    chain: string
): Promise<{ entry?: PublicCoinBookEntry; error?: string }> {
    try {
        const { user } = await requireUser()
        const trimmedAddress = address?.trim()
        const trimmedChain = chain?.trim()

        if (!trimmedAddress) {
            return { error: 'Address is required' }
        }

        if (!trimmedChain) {
            return { error: 'Chain is required' }
        }

        const normalizedAddress = trimmedAddress.toLowerCase()

        const existing = await db.coinBookEntry.findFirst({
            where: {
                userId: user.id,
                chain: trimmedChain,
                address: { equals: trimmedAddress, mode: 'insensitive' },
            },
        })

        if (existing) {
            return { error: 'Token is already saved in your Coin Book for this chain' }
        }

        const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(trimmedAddress)}`
        const response = await fetch(url)

        if (!response.ok) {
            return { error: 'Failed to verify token' }
        }

        const data = await response.json()
        const pairs = Array.isArray(data?.pairs) ? data.pairs : []

        const allowedChainIds = new Set(getMatchingDexScreenerChainIds(trimmedChain))

        const matchingPairs = pairs.filter((pair: any) => {
            const pairChainId = String(pair?.chainId || '').toLowerCase()
            return allowedChainIds.has(pairChainId)
        })

        if (matchingPairs.length === 0) {
            return { error: 'No token found on the selected chain' }
        }

        let bestPair = matchingPairs[0]
        let highestVol = 0

        for (const pair of matchingPairs) {
            const vol = parseFloat(pair?.volume?.h24 || 0)
            if (vol > highestVol) {
                highestVol = vol
                bestPair = pair
            }
        }

        let tokenName = 'Unknown Token'
        let tokenSymbol = 'UNKNOWN'
        let tokenAddr = trimmedAddress
        let imageUrl: string | undefined = undefined

        if (bestPair.baseToken?.address?.toLowerCase() === normalizedAddress) {
            tokenName = bestPair.baseToken.name || tokenName
            tokenSymbol = bestPair.baseToken.symbol || tokenSymbol
            tokenAddr = bestPair.baseToken.address || tokenAddr
        } else if (bestPair.quoteToken?.address?.toLowerCase() === normalizedAddress) {
            tokenName = bestPair.quoteToken.name || tokenName
            tokenSymbol = bestPair.quoteToken.symbol || tokenSymbol
            tokenAddr = bestPair.quoteToken.address || tokenAddr
        } else if (bestPair.baseToken) {
            tokenName = bestPair.baseToken.name || tokenName
            tokenSymbol = bestPair.baseToken.symbol || tokenSymbol
            tokenAddr = bestPair.baseToken.address || tokenAddr
        }

        for (const pair of matchingPairs) {
            if (pair?.info?.imageUrl) {
                imageUrl = pair.info.imageUrl
                break
            }
        }

        const created = await db.coinBookEntry.create({
            data: {
                userId: user.id,
                name: tokenName,
                symbol: tokenSymbol,
                address: tokenAddr,
                chain: trimmedChain,
                imageUrl: imageUrl || null,
            },
            select: {
                id: true,
                name: true,
                symbol: true,
                address: true,
                chain: true,
                imageUrl: true,
            },
        })

        return { entry: toPublic(created) }
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Failed to create coin book entry' }
    }
}

export async function deleteCoinBookEntry(
    id: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        const { user } = await requireUser()

        const existing = await db.coinBookEntry.findFirst({
            where: { id, userId: user.id },
            select: { id: true },
        })

        if (!existing) {
            return { error: 'Coin book entry not found' }
        }

        await db.coinBookEntry.delete({ where: { id: existing.id } })
        return { success: true }
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Failed to delete coin book entry' }
    }
}
