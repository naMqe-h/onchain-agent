export type SidebarSectionId = 'pinned' | 'folders' | 'recent'

export interface AnchorRect {
    top: number
    bottom: number
    left: number
    right: number
    width?: number
    height?: number
}

export interface Chat {
    id: string
    title: string
    createdAt: Date
    updatedAt: Date
    isPinned: boolean
    pinnedAt: Date | null
    folderId: string | null
    network: string
    model?: string
    hasUnread?: boolean
    _count?: { messages: number }
}

export interface Folder {
    id: string
    name: string
    sortOrder: number
}

export interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    parts?: readonly any[]
}

export interface StoredMessage {
    id: string
    role: 'user' | 'assistant' | 'system' | string
    content?: string | null
    parts?: any
    createdAt?: Date | string | null
}

export type AnalysisPanelMode = 'reasoning' | 'tools'

export interface SessionState {
    messages?: StoredMessage[]
    sessionId?: string
    continuationToken?: string
    streamIndex?: number
    activePanelMessageId?: string | null
    activePanelMode?: AnalysisPanelMode | null
}

export type PendingChatSend = {
    chatId?: string
    message?: string
    model?: string
    network?: string
    wallet?: string
    text?: string
    files?: any[]
    createdAt: number
}

export type ChatSearchResult = {
    id?: string
    chatId: string
    title: string
    matchType?: 'title' | 'message'
    snippet: string | null
    updatedAt?: Date
}

export type ChatOnchainTx = {
    id: string
    kind: 'swap' | 'send_native' | 'send_erc20'
    hash: string
    network: string
    explorerUrl: string
    inAmount: string | null
    inSymbol: string | null
    inIsNative: boolean
    outAmount: string | null
    outSymbol: string | null
    outIsNative: boolean
    createdAt: Date | string | null
    status?: string
}
