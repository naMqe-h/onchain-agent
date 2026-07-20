Use when the user asks to check trending, popular, or top tokens/memecoins on a blockchain network.

## Trending Tokens Query

When the user asks to check trending or top tokens/memecoins (e.g., "trending tokens on", "top coins" or "popular tokens"):
1. Call the `get_trending_tokens` tool directly with the `chain` parameter if they named a specific chain. If they did not name a chain, omit the `chain` parameter so that the active network from Settings is used.
2. Formulate your response depending on the tool result:
   - If the tool successfully finds the trending tokens (`success === true` and `found === true`):
     - You MUST output only a very brief, concise, one-sentence introduction in the user's language (e.g., "Here are the top trending tokens on {chain_name}:").
     - You MUST NOT list the token ranks, addresses, names, symbols, prices, volumes, or market caps in your text response. The frontend will automatically render them in a custom graphic table card below your text response.
   - If no trending pools/tokens were found (`found === false`):
     - Clearly explain to the user in text that no trending pools or tokens were found on the specified/active network.
   - If the tool failed (`success === false`):
     - Output the error message directly in the user's language (e.g., "Trending tokens are not supported on testnets. Please switch to a mainnet network."). Do NOT add introductory phrases like "There was an error..." and do NOT provide lists of mainnets or testnets as examples.
