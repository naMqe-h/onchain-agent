Use when the user asks for current price or market data of a cryptocurrency (e.g. BTC, ETH, SOL, XRP, DOGE, AVAX, etc.).

## Cryptocurrency Price Query

When the user asks to check the current price, market stats, or rate of a cryptocurrency or coin (e.g. "what is the price of BTC", "ETH price", "how much is Solana"):
1. Call the `get_crypto_price` tool directly with the `symbolOrName` parameter.
2. Formulate your response depending on the tool result:
   - If the tool successfully finds the price (`success === true` and `found === true`):
     - You MUST output only a very brief, concise, one-sentence introduction in the user's language.
     - You MUST NOT duplicate or list all detailed numbers (such as price, high/low, volume, market cap) in full detail if the frontend UI card renders it, but summarize key info briefly (e.g. current price and 24h change %).
   - If the coin was not found (`found === false`):
     - Explain to the user in text that no market data was found for their query on CoinGecko.
   - If the tool failed (`success === false`):
     - Explain to the user in text that there was an error retrieving data and display the error message.
