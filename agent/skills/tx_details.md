# Transaction Details Skill

Use this skill when the user asks for detailed information about a specific transaction hash (e.g. "check tx 0x...", "what happened in transaction 0x...", "show details for transaction 0x...").

## Guidelines

1. **Transaction Hash**: Ensure the input parameter `txHash` is a valid 66-character hex string starting with `0x`.
2. **Verify Network**: Check details on the active network selected in the UI (`[ACTIVE NETWORK THIS TURN]`).
3. **Tool Execution**: Invoke `get_tx_details` with `{ txHash }`.
4. **Presentation**:
   - On success, output ONLY a single short sentence introducing the transaction details card (e.g. "Here are the details for transaction 0x...:").
   - **Do NOT** list out individual transaction fields, gas fees, or transfer details in the text message - the UI card presents them in a detailed card layout.
   - On failure or if the transaction is not found, inform the user clearly with the error message returned.
