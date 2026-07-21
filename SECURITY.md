# Security Policy

## Supported Versions

Only the latest version on the `master` branch is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

We take the security of **Onchain Agent** seriously. If you discover a security vulnerability, please **DO NOT** open a public issue on GitHub.

Instead, please report the vulnerability privately by following these steps:

1. **Private Disclosure**: Contact the maintainer via email at [naMqe07@gmail.com](mailto:naMqe07@gmail.com) or DM on X [@naMqe7](https://x.com/naMqe7), or send a report via GitHub Private Vulnerability Reporting if enabled.
2. **Details to Include**:
   - Description of the vulnerability and its potential impact.
   - Step-by-step instructions or proof-of-concept script to reproduce the issue.
   - Any suggested remediations or mitigations.
3. **Response Time**: We will acknowledge receipt of your report within 48 hours and provide updates on resolution status.

## Web3 & Private Key Safety Guidelines

- **Never Commit Secrets**: Never commit `.env` files, private keys, seed phrases, or production API keys to the repository.
- **Wallet Encryption**: Ensure `WALLET_ENCRYPTION_KEY` is set to a secure, randomly generated 32-character key in production.
- **RPC & Node Security**: Avoid exposing private RPC endpoints with unrestricted rate limits or sensitive admin APIs.
- **Gas & Transaction Limits**: Test all agent interactions on testnets before running live mainnet automated tasks.
