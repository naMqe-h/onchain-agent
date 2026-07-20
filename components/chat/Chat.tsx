'use client'

import { AnimatePresence } from 'framer-motion'
import ChatInput from './ChatInput'
import ChatMessagesList from './ChatMessagesList'
import ChatTopbar from './ChatTopbar'
import ChatMobileMetaFab from './ChatMobileMetaFab'
import ChatTransactionsPanel from './ChatTransactionsPanel'
import AgentAnalysisPanel from './AgentAnalysisPanel'
import { useChatSession, type UseChatSessionProps } from './hooks/useChatSession'

export default function Chat(props: UseChatSessionProps) {
    const {
        input,
        setInput,
        enrichedMessages,
        totalTokens,
        selectedModel,
        isBusy,
        agentError,
        txPanelOpen,
        chatTitle,
        panelMode,
        activeMessage,
        activeMessageId,
        onchainTxs,
        agentEvents,
        handleSubmit,
        handleModelChange,
        handleToggleAnalysis,
        handleClosePanel,
        handleOpenTransactions,
        handleCloseTxPanel,
    } = useChatSession(props)

    const showChatMeta = Boolean(props.chatId)

    return (
        <div className="relative flex h-full w-full bg-[#131314] overflow-hidden">
            <div className="flex-1 flex flex-col h-full min-w-0">
                {showChatMeta && (
                    <ChatTopbar
                        title={chatTitle}
                        totalTokens={totalTokens}
                        txCount={onchainTxs.length}
                        onOpenTransactions={handleOpenTransactions}
                    />
                )}
                <ChatMessagesList
                    chatId={props.chatId}
                    messages={enrichedMessages}
                    activeMessageId={activeMessageId}
                    activePanelMode={panelMode}
                    onToggleAnalysis={handleToggleAnalysis}
                    isBusy={isBusy}
                    showError={agentError}
                />
                <div className="relative w-full">
                    {showChatMeta && (
                        <ChatMobileMetaFab
                            totalTokens={totalTokens}
                            txCount={onchainTxs.length}
                            onOpenTransactions={handleOpenTransactions}
                        />
                    )}
                    <ChatInput
                        input={input}
                        handleInputChange={(e) => setInput(e.target.value)}
                        handleSubmit={handleSubmit}
                        isBusy={isBusy}
                        selectedModel={selectedModel}
                        onModelChange={handleModelChange}
                        enabledModels={props.enabledModels}
                        isAuthenticated={!!props.userId}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {txPanelOpen ? (
                    <ChatTransactionsPanel
                        key="tx-panel"
                        transactions={onchainTxs}
                        onClose={handleCloseTxPanel}
                    />
                ) : activeMessage && panelMode ? (
                    <AgentAnalysisPanel
                        key={`${activeMessageId}-${panelMode}`}
                        activeMessage={activeMessage}
                        onClose={handleClosePanel}
                        agentEvents={agentEvents}
                        mode={panelMode}
                    />
                ) : null}
            </AnimatePresence>
        </div>
    )
}
