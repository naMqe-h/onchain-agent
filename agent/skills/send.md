Use when the user wants to send or transfer funds (native currency or ERC-20 tokens).

## Choosing `send_native` vs `send_erc20`

When the user wants to send or transfer funds (not swap), decide the asset type BEFORE confirming or calling any send tool.

### Use `send_erc20` (NOT `send_native`) when ANY of these is true:
- The user mentions ERC-20, token, units of a token, a ticker/symbol (e.g. USDC, USDT, or any other symbol), a token name, or a **token contract address**.
- The prompt pattern is: **amount + asset + from wallet + to wallet** (e.g. `send 10 USDC from primary to secondary` or `send 5 0xC9f9… from primary to secondary`).
- Any non-native asset the user names may be an ERC-20 held on their wallet - even if the ticker/name looks familiar from traditional finance. Never refuse such requests as "stocks not supported" or "not a crypto token". Always use `send_erc20` and let the tool resolve the contract from the sender's balances.
- The user says they want to send tokens they hold (without saying ETH/POL/native).

### Use `send_native` ONLY when:
- The user clearly means **native currency** (says ETH / POL / Ether / native, matching the active network), **OR**
- They give only: amount + recipient (wallet name or address), with **no** token contract, **no** token name/ticker, and **no** wording that implies a token.
- Examples: `send 0.01 ETH to secondary`, `send 1 POL from primary to 0xabc…`, `send 0.001 eth from primary to 0xabc…`.

### Never do this:
- Do **not** call `send_native` when the user named any non-native asset (e.g. USDC, USDT, any other ticker/name, or a contract address).
- Do **not** reinterpret a token amount (e.g. `5`) as a tiny native amount (e.g. `0.000005`).
- Do **not** refuse a ticker or token name without calling tools. Pass it as `token` to `send_erc20`; the tool resolves the contract from wallet balances.
- If still ambiguous after parsing (cannot tell native vs token), **ask one clarifying question** instead of calling a send tool.

### Short natural-language examples:
| User intent | Correct tool |
|---|---|
| `send 5 0xC9f9… from x to y` | `send_erc20` with `token=0xC9f9…` |
| `send 10 USDC from x to y` | `send_erc20` with `token=USDC` (tool resolves contract) |
| `send 5 USDT from x to y` | `send_erc20` with `token=USDT` |
| `send 0.01 ETH from x to y` | `send_native` |
| `send 1 POL to y` (Polygon active) | `send_native` |
| `send 0.01 to y` (no token, no contract) | `send_native` only if user confirms native currency; if unclear, ask |

## Native Currency Transfers
When the user asks to send or transfer **native currency** (after the rules above):
1. Follow **`[TX CONFIRMATION POLICY THIS TURN - BINDING]`** before calling `send_native` (always ask / agent decides / never ask). When the policy requires confirmation, summarize amount + native symbol for the active network, recipient, active network name, and sender (UI active wallet unless they named another wallet) and wait for explicit confirmation unless the policy allows skipping.
2. Call `send_native` with `toAddress` set to the recipient as the user said it (`0x…`, wallet name, or address book name) and `amount`. The tool resolves names. Omit `fromAddressOrName` unless the user explicitly requested a different **wallet** than the UI selection (address book names cannot be senders).
3. If `send_native` returns `success: false`, report the error clearly to the user in text.
4. Once the transaction is successfully executed (`success === true`):
   - You MUST output only a very brief, concise, one-sentence introduction in the user's language that points them to the details below (e.g. "Transfer completed - details below:").
   - You MUST NOT duplicate or list the transaction details in your text response (hash, from, to, amount, gas used, gas price, gas fee, status, or network). The frontend will automatically render them in a custom graphic card below your text response.
   - If `status` is `pending`: say the transfer was **submitted** and may still be confirming; do not claim failure.

## ERC-20 Token Transfers
When the user asks to send or transfer an **ERC-20 token** (including short forms without the words "ERC-20"/"token"):
1. Call `send_erc20` with:
   - `token`: the contract address **or** the ticker/name exactly as the user said it (e.g. `USDC`, `USDT`) - the tool resolves tickers from the **sender wallet ERC-20 balances** automatically.
   - `toAddress`: recipient `0x…`, wallet name, or address book name (e.g. `secondary`, `exchange`); the tool resolves names.
   - `amount`: human-readable amount.
   - `fromAddressOrName`: only if the user explicitly named a different **wallet** than the UI active wallet (not address book).
2. You do **not** need to call `get_token_balances` yourself before `send_erc20` for ticker resolution (the send tool does that). You may still call it if the user only wants to list balances.
3. Do **not** use `get_token_info` to resolve transfers. Do **not** invent contract addresses. Do **not** refuse a user-provided ticker or token name as unsupported without trying `send_erc20` (or reporting its error).
4. Follow **`[TX CONFIRMATION POLICY THIS TURN - BINDING]`** before calling `send_erc20` (amount, token ticker/name, recipient, active network; note sender is the active UI wallet unless overridden). Confirm only when the policy requires it; in `never` mode call the tool once parameters are clear.
5. If `send_erc20` returns `success: false` with `availableTokens` or a not-found error, report that clearly to the user in text (token not held on the sender wallet / multiple matches / insufficient balance / other error message).
6. Once the transaction is successfully executed (`success === true`):
   - You MUST output only a very brief, concise, one-sentence introduction in the user's language that points them to the details below (e.g. "Transfer completed - details below:").
   - You MUST NOT duplicate or list the transaction details in your text response (hash, from, to, token address/symbol, amount, gas used, gas price, gas fee, status, or network). The frontend will automatically render them in a custom graphic card below your text response.
   - If `status` is `pending`: say the transfer was **submitted** and may still be confirming; do not claim failure.
