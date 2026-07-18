import { create } from 'zustand'
import { getUserWallets, type PublicWallet } from '../app/actions/wallet'

const STORAGE_KEY = 'activeWalletAddress'

function readStoredAddress(): string | null {
    if (typeof window === 'undefined') return null
    try {
        return localStorage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

function writeStoredAddress(address: string | null) {
    if (typeof window === 'undefined') return
    try {
        if (address) localStorage.setItem(STORAGE_KEY, address)
        else localStorage.removeItem(STORAGE_KEY)
    } catch { }
}

function pickSelected(wallets: PublicWallet[], preferred: string | null): string | null {
    if (wallets.length === 0) return null
    if (preferred) {
        const match = wallets.find(w => w.address.toLowerCase() === preferred.toLowerCase())
        if (match) return match.address
    }
    return wallets[0].address
}

interface WalletStore {
    wallets: PublicWallet[]
    selectedAddress: string | null
    isLoading: boolean
    loadedForUserId: string | null
    setSelectedAddress: (address: string) => void
    setWallets: (wallets: PublicWallet[]) => void
    loadWallets: (userId: string) => Promise<void>
    clearWallets: () => void
}

export const useWalletStore = create<WalletStore>((set, get) => ({
    wallets: [],
    selectedAddress: null,
    isLoading: false,
    loadedForUserId: null,

    setSelectedAddress: (address: string) => {
        writeStoredAddress(address)
        set({ selectedAddress: address })
    },

    setWallets: (wallets: PublicWallet[]) => {
        const current = get().selectedAddress ?? readStoredAddress()
        const selectedAddress = pickSelected(wallets, current)
        writeStoredAddress(selectedAddress)
        set({ wallets, selectedAddress })
    },

    loadWallets: async (userId: string) => {
        set({ isLoading: true })
        try {
            const wallets = await getUserWallets(userId)
            const preferred = get().selectedAddress ?? readStoredAddress()
            const selectedAddress = pickSelected(wallets, preferred)
            writeStoredAddress(selectedAddress)
            set({
                wallets,
                selectedAddress,
                loadedForUserId: userId,
                isLoading: false,
            })
        } catch {
            set({ isLoading: false })
        }
    },

    clearWallets: () => {
        writeStoredAddress(null)
        set({
            wallets: [],
            selectedAddress: null,
            loadedForUserId: null,
            isLoading: false,
        })
    },
}))
