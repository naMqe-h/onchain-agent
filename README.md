# Onchain Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

**Onchain Agent** is an open-source, autonomous AI-powered Web3 platform designed to execute multi chain EVM transactions, manage encrypted wallets, perform Uniswap DEX swaps, inspect block explorers, and analyze tokens using natural language.

---

## Key Features

- **Autonomous AI Agent Engine**: Powered by the Eve framework and Vercel AI SDK, supporting OpenAI, Google Gemini, OpenRouter, Anthropic (Claude), and xAI (Grok) models with per-chat model selection.
- **BYOK (Bring Your Own Key) & Custom Models**: Store encrypted personal provider API keys and register custom AI models per user account.
- **Multi-Chain EVM Support**: Native support for Ethereum (Mainnet/Sepolia), Polygon, Robinhood Chain (Mainnet/Testnet), and customizable RPC endpoints.
- **Secure Wallet Management**: Multi-wallet creation, AES key encryption (`WALLET_ENCRYPTION_KEY`), password-protected private key export, and multi-wallet balance tracking.
- **Address Book & Contact Management**: Save recipient addresses and custom contact aliases for seamless transfers.
- **DEX Trading Integration**: Automated token swaps via Uniswap Trading API with smart routing (Universal Router v2.0 & v2.1.1) and slippage control.
- **Market & Token Analytics**: Real-time crypto price lookup with 7D sparkline charts (CoinGecko), token search/metadata lookup and trending tokens (DexScreener API).
- **Block Explorer & Transaction Tooling**: Real-time transaction receipt tracking, tx verification & log inspection (`get_tx_details`), transaction history, and native/ERC-20 token balance queries.
- **Soft Quota & LLM Rate Limiting**: Intelligent token usage metrics, rate limiting (RPM/TPD), cost tracking, and soft quota enforcement.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **UI & Styling**: [React 19](https://react.dev/), [TailwindCSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Database & ORM**: [Supabase](https://supabase.com/) Postgres & [Prisma ORM](https://www.prisma.io/)
- **Web3 Libraries**: [Viem](https://viem.sh/), Uniswap API, Blockscout API v2
- **AI Engine**: [Eve Framework](https://eve.dev/)
- **Market**: DexScreener API, CoinGecko API
- **Caching**: Redis / Vercel KV

---

## Getting Started

### Prerequisites

- **Node.js**: v24.x or newer
- **Database**: PostgreSQL (Supabase recommended) or Docker
- **Docker** (Optional, for containerized environment)

---

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/naMqe-h/onchain-agent.git
   cd onchain-agent
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your database URLs, API keys, and encryption secrets (see [Environment Variables](#environment-variables)).

4. **Generate Prisma Client & Database Migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Running with Docker

Alternatively, you can run the development environment using Docker Compose:

```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## Environment Variables

Below is a reference of required and optional environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Connection string for PostgreSQL (Pooled connection) |
| `DIRECT_URL` | Yes | Direct connection string for PostgreSQL (Migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous public API key |
| `WALLET_ENCRYPTION_KEY` | Yes | 32-character secret key for wallet private key encryption |
| `OPENAI_API_KEY` | Optional | OpenAI API key for AI Agent |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Google Gemini API key |
| `OPENROUTER_API_KEY` | Optional | OpenRouter API key |
| `ANTHROPIC_API_KEY` | Optional | Anthropic API key for Claude models |
| `XAI_API_KEY` | Optional | xAI API key for Grok models |
| `UNISWAP_API_KEY` | Optional | Uniswap API Key for DEX trading |
| `COINGECKO_API_KEY` | Optional | CoinGecko API key for crypto price lookup & 7D charts |
| `REDIS_URL` | Optional | Redis connection URL for caching market & price data |
| `ALCHEMY_RPC_URL_*` | Optional | Custom Alchemy RPC endpoints per chain |
| `BLOCKSCOUT_API_KEY_MAINNET` | Optional | Shared API key for Blockscout Explorer endpoints |
| `BLOCKSCOUT_API_URL_*` | Optional | Custom Blockscout v2 API URLs per chain |
| `TX_RECEIPT_TIMEOUT_MS` | Optional | Max ms agent tools wait for tx receipt before returning pending (default 45000) |
| `USAGE_ENFORCE` | Optional | Enable LLM usage metrics and soft quota enforcement (`true`/`false`) |
| `USAGE_ESTIMATE_WHEN_MISSING` | Optional | Estimate usage for models without usage headers (`true`/`false`) |
| `USAGE_LLM_REQUESTS_PER_MINUTE` | Optional | LLM requests per minute rate limit (RPM) |
| `USAGE_LLM_REQUESTS_PER_DAY` | Optional | LLM requests per day rate limit (RPD) |
| `USAGE_LLM_TOKENS_PER_DAY` | Optional | Daily LLM token soft quota limit |
| `USAGE_LLM_TOKENS_SOFT_RATIO` | Optional | Soft quota warning ratio threshold (e.g. 0.8) |
| `USAGE_ESTIMATE_BASE_INPUT_TOKENS` | Optional | Base input tokens estimation overhead (default 1000) |


---

## Security

Security is critical when interacting with Web3 infrastructure and private keys.
- Never share or commit your `.env` file or `WALLET_ENCRYPTION_KEY`.
- Read our [SECURITY.md](SECURITY.md) for vulnerability reporting and safety recommendations.

---

## Contributing

We welcome contributions to Onchain Agent! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for guidelines on submitting pull requests and community standards.

---

## License

This project is open-source under the [MIT License](LICENSE).
