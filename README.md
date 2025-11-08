Project goals (MVP)

One-account experience combining casino (provably fair slots + blackjack) and sportsbook (pre-match + live odds) with unified wallet (crypto + fiat).

Modular services so features scale independently (games, sportsbook, wallet, KYC, admin).

Production-grade security, compliance hooks (KYC/AML), auditability for RNG, and GDPR-ready handling.

Developer-friendly repo: runnable locally with Docker, automated tests, GitHub Actions CI, staging/prod pipeline.

Tech choices (recommended for MVP)

Frontend: React + Vite + TypeScript

Backend: Node.js (TypeScript) with NestJS (modular, DI, great for microservices style)

API gateway: Fastify or NestJS Gateway + NGINX reverse-proxy

Data stores:

Relational: Postgres (primary ledger and relational data)

NoSQL / cache: Redis (sessions, caching, pub/sub for live updates)

Event store / message broker: Kafka or RabbitMQ (bet events, settlements, wallet events)

Storage: S3-compatible (game assets, proofs)

Containerization: Docker + Kubernetes (EKS/GKE/AKS) for prod

CI/CD: GitHub Actions -> build images -> push to container registry -> deploy to staging/prod via ArgoCD or GitHub Actions workflows

Repo layout (single repo mono-repo style)
gamblestack/
├── README.md
├── infra/                  # Terraform / k8s manifests / helm charts
├── docker/                 # Dockerfiles & compose
├── services/
│   ├── api-gateway/
│   ├── auth/               # auth + sessions + 2FA
│   ├── wallet/             # unified wallet, deposits, withdrawals
│   ├── sportsbook/         # odds ingestion, markets, betting engine
│   ├── games/              # game engine host (slots, blackjack)
│   ├── games-provablyfair/ # provably fair helpers + audit logs
│   ├── kyc/                # eKYC integration microservice
│   ├── admin/              # admin dashboard backend
│   └── notifications/      # emails, sms, push
├── web/                    # frontend (React)
├── infra-as-code/          # terraform modules
├── scripts/                # local dev scripts
└── docs/                   # handover docs, SOPs, security review
High-level architecture

Frontend (SPA) talks to API Gateway over TLS.

API gateway routes to microservices (Auth, Wallet, Sportsbook, Games, KYC, Admin).

Message bus (Kafka/RabbitMQ) handles bet placement, settlement, wallet ledger events.

Database: Postgres primary; Redis for caching and live score pub/sub.

Odds ingestion: dedicated service consumes third-party odds feeds (Sportradar / Betradar / OddsAPI), normalizes markets, pushes to sportsbook service.

Provably fair: Games service requests RNG from an auditable source (on-chain VRF like Chainlink VRF or an HSM-backed CSPRNG); stores commitments & receipts in an append-only audit log (S3 + signed hash in DB).

Payments: Wallet microservice integrates with fiat gateways (Stripe/Adyen/Worldpay depending on market) and crypto processors (Coinbase Commerce, CoinsPaid or self-hosted BTCPay).

KYC/AML: KYC service integrates with providers (Trulioo/Onfido/Sumsub) and AML screening providers.

Key modules — responsibilities

Auth: JWT + refresh tokens, device management, 2FA (TOTP & SMS), password policy, rate-limiting, session revocation.

Wallet: ledger-first architecture (double-entry), atomic operations, pending/cleared balances, bonus balances, withdrawals queue, reconciliation jobs.

Sportsbook: market modeling, bet-slip builder, bet validation, live odds delta handling, settlement engine, cash-out algorithm.

Games: game lifecycle, bet acceptance, RNG integration, paytable rules, audit receipts storage.

KYC: capture identity documents, biometric checks, PEP & sanctions screening, webhook-based status updates.

Admin: role-based access control, odds overrides, game controls (disable/enable), manual settlements, reporting, AML alerts.
