export const getAgentStatusText = (agentEvents?: readonly any[]) => {
    if (!agentEvents || agentEvents.length === 0) {
        return 'Analyzing request...'
    }

    const lastEvent = agentEvents[agentEvents.length - 1]

    if (lastEvent.type === 'actions.requested') {
        const firstAction = lastEvent.data?.actions?.[0]
        const toolName = firstAction?.toolName

        switch (toolName) {
            case 'get_balance':
                return 'Checking balance...'
            case 'get_token_balances':
                return 'Checking token balances...'
            case 'get_swap_quote':
                return 'Retrieving swap quote...'
            case 'swap_tokens':
                return 'Executing token swap...'
            case 'send_native':
            case 'send_erc20':
                return 'Signing transaction...'
            case 'get_tx_history':
                return 'Reading transaction history...'
            case 'get_address_book':
                return 'Retrieving address book...'
            case 'get_token_info':
                return 'Getting token info...'
            case 'get_crypto_price':
                return 'Checking crypto price...'
            case 'get_trending_tokens':
                return 'Fetching trending tokens...'
            case 'get_user_wallets':
                return 'Retrieving user wallets...'
            case 'update_chat_title':
                return 'Updating conversation title...'
            default:
                return 'Running tasks...'
        }
    }

    if (lastEvent.type === 'action.result') {
        return 'Processing results...'
    }

    if (lastEvent.type === 'step.started') {
        return 'Analyzing request...'
    }

    if (lastEvent.type === 'step.completed') {
        return 'Formulating response...'
    }

    return 'Analyzing request...'
}
