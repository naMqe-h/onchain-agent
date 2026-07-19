# Transaction History Skill

Use this skill when the user wants to check their wallet transaction history, view past transactions, or verify recent transfers (e.g. "what did I send recently?", "show my past transactions").

## Guidelines

1. **Verify network**: Always check transaction history on the active network selected in the UI (`[ACTIVE NETWORK THIS TURN]`). If the user specifies a network, confirm it or notify them if it differs from the active one.
2. **Resolve wallet/address**: 
   - If the user names a specific wallet, address, or address book entry, pass it as `walletAddressOrName` parameter.
   - If they ask generally ("what did I send?", "my transactions"), omit the parameter so the active wallet is queried.
3. **Limit**: Default to 10 transactions. If the user asks for more, adjust the `limit` parameter (up to 50).
4. **Presentation**: 
   - On success with a non-empty list, output ONLY a single, short sentence introducing the transaction card (e.g. "Here is your transaction history:"). 
   - **Do NOT** list the transactions or hashes in the text message - the UI card does it in a beautiful, interactive list.
   - If there are no transactions, inform the user that the address has no history on that network.
