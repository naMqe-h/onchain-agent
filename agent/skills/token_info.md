Use when the user asks to check information about a memecoin or ERC-20 token.

## Token Information Query

When the user asks to check information about a memecoin or ERC-20 token (e.g. name, symbol/ticker, contract address, image, price, volume, market cap, or details on the active network):
1. Call the `get_token_info` tool directly with the `query` parameter. Search is limited to the **active network**.
2. Formulate your response depending on the tool result:
   - If the tool successfully finds the token (`success === true` and `found === true`):
     - You MUST output only a very brief, concise, one-sentence introduction in the user's language (e.g. "Here is the summary of the market data for this token:").
     - You MUST NOT duplicate or list the token details (such as price, volume, market cap, address, image/logo, websites, or socials) in your text response. The frontend will automatically render them in a custom graphic card below your text response.
   - If the token was not found (`found === false`):
     - Clearly explain to the user in text that no trading pairs/tokens matching their query were found on the **active network** on DEX Screener.
   - If the tool failed (`success === false`):
     - Explain to the user in text that there was an error retrieving the token data and display the error message.
