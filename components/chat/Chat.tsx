'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatInput from './ChatInput'
import ChatMessagesList from './ChatMessagesList'
import ChatTopbar from './ChatTopbar'
import ChatMobileMetaFab from './ChatMobileMetaFab'
import ChatTransactionsPanel from './ChatTransactionsPanel'
import AgentAnalysisPanel from './AgentAnalysisPanel'
import ConfirmContextModal, { type ContextModalMode } from './ConfirmContextModal'
import { useChatSession, type UseChatSessionProps } from './hooks/useChatSession'

export default function Chat(props: UseChatSessionProps) {
    const [confirmModalMode, setConfirmModalMode] = useState<ContextModalMode | null>(null)

    const {
        input,
        setInput,
        enrichedMessages,
        totalTokens,
        selectedModel,
        selectedNetwork,
        isBusy,
        isCompacting,
        isClearing,
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
        handleNetworkChange,
        handleToggleAnalysis,
        handleClosePanel,
        handleOpenTransactions,
        handleCloseTxPanel,
        handleStop,
        handleCompactContext,
        handleClearContext,
    } = useChatSession(props)

    const showChatMeta = Boolean(props.chatId)
    const isChatEmpty = (!enrichedMessages || enrichedMessages.length === 0) && !agentError

    return (
        <div className="relative flex h-full w-full bg-[#131314] overflow-hidden">
            <div className="flex-1 flex flex-col h-full min-w-0">
                {showChatMeta && (
                    <ChatTopbar
                        title={chatTitle}
                        totalTokens={totalTokens}
                        txCount={onchainTxs.length}
                        onOpenTransactions={handleOpenTransactions}
                        onRequestCompact={() => setConfirmModalMode('compact')}
                        onRequestClear={() => setConfirmModalMode('clear')}
                        isCompacting={isCompacting}
                        isClearing={isClearing}
                    />
                )}
                {isChatEmpty ? (
                    <div className="flex-1 flex flex-col items-center justify-center relative p-4 md:p-8 min-w-0 w-full">
                        <div className="relative w-full max-w-4xl flex items-center justify-center">
                            <motion.div
                                animate={{
                                    opacity: [0.4, 0.75, 0.4],
                                    scale: [0.97, 1.03, 0.97],
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 3.5,
                                    ease: 'easeInOut',
                                }}
                                className="absolute -inset-3 sm:-inset-5 bg-linear-to-r from-purple-600/40 via-indigo-500/35 to-violet-600/40 blur-2xl rounded-3xl pointer-events-none"
                            />
                            <div className="relative w-full z-10">
                                <ChatInput
                                    input={input}
                                    handleInputChange={(e) => setInput(e.target.value)}
                                    handleSubmit={handleSubmit}
                                    onStop={handleStop}
                                    isBusy={isBusy}
                                    selectedModel={selectedModel}
                                    onModelChange={handleModelChange}
                                    selectedNetwork={selectedNetwork}
                                    onNetworkChange={handleNetworkChange}
                                    enabledModels={props.enabledModels}
                                    isAuthenticated={!!props.userId}
                                    isExpanded
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <ChatMessagesList
                            chatId={props.chatId}
                            messages={enrichedMessages}
                            activeMessageId={activeMessageId}
                            activePanelMode={panelMode}
                            onToggleAnalysis={handleToggleAnalysis}
                            isBusy={isBusy}
                            showError={agentError}
                            agentEvents={agentEvents}
                            activeNetwork={selectedNetwork}
                        />
                        <div className="relative w-full">
                            {showChatMeta && (
                                <ChatMobileMetaFab
                                    totalTokens={totalTokens}
                                    txCount={onchainTxs.length}
                                    onOpenTransactions={handleOpenTransactions}
                                    onRequestCompact={() => setConfirmModalMode('compact')}
                                    onRequestClear={() => setConfirmModalMode('clear')}
                                    isCompacting={isCompacting}
                                    isClearing={isClearing}
                                />
                            )}
                            <ChatInput
                                input={input}
                                handleInputChange={(e) => setInput(e.target.value)}
                                handleSubmit={handleSubmit}
                                onStop={handleStop}
                                isBusy={isBusy}
                                selectedModel={selectedModel}
                                onModelChange={handleModelChange}
                                selectedNetwork={selectedNetwork}
                                onNetworkChange={handleNetworkChange}
                                enabledModels={props.enabledModels}
                                isAuthenticated={!!props.userId}
                            />
                        </div>
                    </>
                )}
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

            <ConfirmContextModal
                isOpen={!!confirmModalMode}
                mode={confirmModalMode}
                isPending={isCompacting || isClearing}
                onClose={() => setConfirmModalMode(null)}
                onConfirm={async () => {
                    const targetMode = confirmModalMode
                    setConfirmModalMode(null)
                    if (targetMode === 'compact') {
                        await handleCompactContext()
                    } else if (targetMode === 'clear') {
                        await handleClearContext()
                    }
                }}
            />
        </div>
    )
}
