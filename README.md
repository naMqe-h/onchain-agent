# Onchain Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

**Onchain Agent** is an open-source, autonomous AI-powered Web3 platform designed to execute multi chain EVM transactions, manage encrypted wallets, perform Uniswap DEX swaps, inspect block explorers, and analyze tokens using natural language.

---

## Key Features

- **Autonomous AI Agent Engine**: Powered by the Eve framework and Vercel AI SDK, supporting OpenAI, Google Gemini, and OpenRouter models.
- **Multi-Chain EVM Support**: Native support for Ethereum (Mainnet/Sepolia), Polygon, Robinhood Chain (Mainnet/Testnet) and customizable RPC endpoints.
- **Secure Wallet Management**: Multi-wallet creation, AES key encryption (`WALLET_ENCRYPTION_KEY`), and password protected private key export.
- **DEX Trading Integration**: Automated token swaps via Uniswap Trading API with smart routing and slip tolerance.
- **Blockscout Explorer Tooling**: Real time transaction receipt tracking, event log decoding, and token balance queries.
- **Soft Quota & LLM Rate Limiting**: Intelligent token usage metrics, rate limiting (RPM/TPD), and cost tracking.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **UI & Styling**: [React 19](https://react.dev/), [TailwindCSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Database & ORM**: [Supabase](https://supabase.com/) Postgres & [Prisma ORM](https://www.prisma.io/)
- **Web3 Libraries**: [Viem](https://viem.sh/), Uniswap API, Blockscout API v2
- **AI Engine**: [Eve Framework](https://eve.dev/), `@ai-sdk/openai`, `@ai-sdk/google`, `@openrouter/ai-sdk-provider`

---

## Getting Started

### Prerequisites

- **Node.js**: v20.x or higher
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
| `OPENAI_API_KEY` | Optional | OpenAI API key for AI Agent |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Google Gemini API key |
| `OPENROUTER_API_KEY` | Optional | OpenRouter API key |
| `WALLET_ENCRYPTION_KEY` | Yes | 32-character secret key for wallet private key encryption |
| `UNISWAP_API_KEY` | Optional | Uniswap API Key for DEX trading |
| `ALCHEMY_RPC_URL_*` | Optional | Custom Alchemy RPC endpoints per chain |
| `BLOCKSCOUT_API_KEY_MAINNET` | Optional | Shared API key for Blockscout Explorer endpoints |

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
