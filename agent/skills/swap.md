Use when the user wants to swap, exchange, trade, convert, or query quotes for assets (e.g. swap ETH to USDC).

## Swap vs Send

When the user wants to swap / exchange / trade / convert one asset for another (e.g. `swap 0.001 ETH to USDC`, `exchange USDC for ETH`), use the swap tools - not `send_native` / `send_erc20`.

### Use `get_swap_quote` + `swap_tokens` when:
- The user says swap, exchange, trade, convert, or equivalent, with **tokenIn + tokenOut** (and amount).
- Direction is clear: sell amount of A to receive B (EXACT_INPUT).
- Tickers/names are OK (`ETH`, `USDC`, `USDT`) - tools resolve addresses on the active network.
- Supported networks: **Ethereum**, **Ethereum Sepolia**, **Polygon**, **Robinhood**.
- **Not supported:** Robinhood Testnet (tool returns a clear error - suggest switching network).

### Swap workflow
1. Follow **`[TX CONFIRMATION POLICY THIS TURN - BINDING]`**.
2. In `always` mode (or when you choose to confirm in `agent_decides`): call **`get_swap_quote`** first with `tokenIn`, `tokenOut`, `amount` (and optional `slippageTolerance`). Summarize expected amountOut, slippage, network, wallet; wait for confirmation; then call **`swap_tokens`** with the same params.
3. In `never` mode with complete params: call **`swap_tokens`** directly.
4. Do **not** invent token contract addresses. Pass tickers as the user said them.
5. If quote/swap fails (no route, ambiguous token, insufficient balance): report the tool error clearly.
6. Once `swap_tokens` returns `success === true`:
   - Output only a very brief one-sentence intro in the user's language pointing to the card below.
   - Do **not** list hash, amounts, gas, or addresses in text - the UI renders a swap card.
   - If `status` is `pending` (confirmation still in progress / timed out waiting for receipt): say briefly that the swap was **submitted** and may still be confirming on-chain; the card has the hash and explorer link. Do not claim it failed.

### Short swap examples
| User intent | Correct tools |
|---|---|
| `swap 0.001 eth to usdc` | `get_swap_quote` (if confirming) then `swap_tokens` with tokenIn=ETH, tokenOut=USDC, amount=0.001 |
| `swap 5 USDC to ETH` | same with tokenIn=USDC, tokenOut=ETH |
| `swap 1 USDC to USDT` | tokenIn=USDC, tokenOut=USDT |
| `how much USDC for 0.01 ETH?` | `get_swap_quote` only (read) |
