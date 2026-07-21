export type PublicProfile = {
    id: string
    userId: string
    displayName: string
    avatarUrl: string | null
}

export type PublicWallet = {
    id: string
    name: string
    address: string
    type: string
}

export type AuthSessionItem = {
    id: string
    createdAt: Date | string
    updatedAt?: string | null
    userAgent?: string | null
    ipAddress?: string
    ip?: string | null
    isCurrent: boolean
    deviceLabel?: string
}

export type TxConfirmationMode = 'always' | 'agent_decides' | 'never'

export type PublicAddressBookEntry = {
    id: string
    name: string
    address: string
    userId?: string
    network?: string
    notes?: string | null
    createdAt?: Date | string
}

export type PublicCoinBookEntry = {
    id: string
    userId?: string
    name: string
    symbol: string
    address: string
    chain?: string
    network?: string
    imageUrl?: string | null
    notes?: string | null
    createdAt?: Date | string
}

export type SettingsTab =
    | 'profile'
    | 'wallets'
    | 'addressBook'
    | 'coinBook'
    | 'security'
    | 'sessions'
    | 'network'
    | 'models'
    | 'usage'
    | 'archived'
