Use when the user wants to check native currency balance or ERC-20 token balances.

## Balance Checks

When the user asks to check native balance or ERC-20 token balances:
1. **First** scan the user message for a `0x` address (42 chars) or an explicit wallet / address book name to query. If present → call `get_balance` with `address` / `get_token_balances` with `walletAddressOrName` set to that value. Do not use the UI wallet.
2. Only if there is **no** address and **no** name (including "my wallet" / "my balance" / generic "check balance"): call the tool **immediately** with **no** wallet parameter. Never ask for confirmation that the active UI wallet is correct.
3. For **native** balance (`get_balance`): output a clean, formatted summary (include the **address returned by the tool**, amount, symbol, and network).
4. For **ERC-20** balances (`get_token_balances`), formulate your response depending on the tool result:
   - If `success === true` and `tokens` is a **non-empty** array:
     - You MUST output only a very brief, concise, one-sentence introduction in the user's language that points them to the table below (e.g. "ERC-20 balances are shown below:").
     - You MUST NOT list, enumerate, or summarize individual tokens in your text response (name, symbol, balance, valueUsd, contract address). The frontend will automatically render them in a custom table below your text.
     - If `truncated` / `note` is present, you may add **one** short sentence that only the top tokens by approximate USD value were returned - still do not list the rows.
   - If `success === true` and `tokens` is **empty** (or missing):
     - Tell the user clearly in text that this wallet holds **no ERC-20 tokens** on the active network. Include the address returned by the tool and the network. Do not invent or describe a table.
   - If `success === false`:
     - Explain the error clearly in text.
