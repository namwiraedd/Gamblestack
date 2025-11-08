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


Solid — you picked **A (Node.js + React + Postgres)**. Nice move. I’ll give you the exact, no-fluff playbook to *run the skeleton you already have* and immediately exercise the core flows (signup/login, ledger entry, place bet, provably-fair spin). Follow these steps and you’ll have a working local MVP.

I’m assuming you pasted the skeleton files I gave earlier into the repo root `gamblestack/`. If you haven’t, paste those files first. Now do this.

---

# Quick checklist (what you need installed)

* Git
* Docker & Docker Compose
* Node 20 (or nvm + Node 20)
* psql CLI (optional but helpful)

---

# 1) Create `.env` from the example

In repo root:

```bash
cp .env.example .env
```

(You can use the defaults in `.env.example` for local dev.)

---

# 2) Apply DB migrations (one-time)

Run this once to create tables used by services.

If you have `psql` locally and Postgres listening on `localhost:5432`:

```bash
psql "$DATABASE_URL" -f infra/migrations/001_init.sql
```

If Postgres is running in Docker-compose (recommended), do:

```bash
# start only Postgres so migrations can run against it
docker-compose -f docker/local.yml up -d postgres
# wait a few seconds for DB to be ready, then:
docker-compose exec postgres bash -c "apt-get update && apt-get install -y postgresql-client && \
psql $DATABASE_URL -f /var/lib/postgresql/data/infra_migrations.sql" || true
```

If that looks hairy, easiest route: start the whole compose (next step) and run migrations from a local psql once DB is up.

---

# 3) Start the stack with Docker Compose

This will build and start all services from the skeleton.

```bash
docker-compose -f docker/local.yml up --build
```

* API gateway → `http://localhost:4000/health`
* Frontend (Vite preview) → `http://localhost:3000` (or dev server at `5173` if you run `pnpm dev` locally)
* Auth service → proxied at `http://localhost:4000/auth`
* Wallet service → proxied at `http://localhost:4000/wallet`
* Sportsbook → proxied at `http://localhost:4000/sportsbook`
* Games provably-fair → proxied at `http://localhost:4000/games`

If ports conflict or a service fails to start, check `docker-compose` logs:

```bash
docker-compose -f docker/local.yml logs -f
```

---

# 4) Quick smoke tests (curl) — run these from your machine

1. **Health**

```bash
curl http://localhost:4000/health
# expected: {"ok":true}
```

2. **Signup**

```bash
curl -s -X POST http://localhost:4000/auth/signup -H "Content-Type: application/json" \
  -d '{"email":"test@you.com","password":"P@ssw0rd"}' | jq
```

Expected: JSON user id/email.

3. **Login**

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"test@you.com","password":"P@ssw0rd"}' | jq -r .token)
echo $TOKEN
```

4. **Create a ledger entry (wallet)**

```bash
curl -s -X POST http://localhost:4000/wallet/ledger -H "Content-Type: application/json" \
  -d '{"user_id":"<PASTE_USER_ID_FROM_SIGNUP>","tx_id":"'"$(uuidgen)"'","account":"WALLET_MAIN","amount":100,"currency":"USD","type":"credit"}' | jq
```

Expected: `{ id: <ledger id> }`

5. **Check balance**

```bash
curl -s http://localhost:4000/wallet/balance/<PASTE_USER_ID> | jq
```

6. **List markets**

```bash
curl -s http://localhost:4000/sportsbook/markets | jq
```

7. **Place trivial bet**

```bash
curl -s -X POST http://localhost:4000/sportsbook/place -H "Content-Type: application/json" \
  -d '{"user_id":"<PASTE_USER_ID>","market_id":"m1","stake":10,"selection":"1"}' | jq
```

Expected: JSON with bet id and potential_win.

8. **Provably-fair commit / spin**

```bash
# commit returns server_seed_hash & id
curl -s -X POST http://localhost:4000/games/seed/commit -H "Content-Type: application/json" | jq
# take server_seed value returned from commit (demo returns one for now) and spin
curl -s -X POST http://localhost:4000/games/spin -H "Content-Type: application/json" \
  -d '{"server_seed":"<server_seed>","client_seed":"user123","nonce":1}' | jq
```

Expected: reels array, win boolean.

---

# 5) Local dev (recommended workflow)

Instead of running built images for web, do hot reload:

From repo root:

```bash
cd web
pnpm install    # or npm install / yarn
pnpm dev
# open the local dev URL that Vite prints (likely http://localhost:5173)
```

For backend services, run them locally for faster dev:

```bash
# in services/auth
cd services/auth
pnpm install
pnpm run dev   # or: node src/main.ts via ts-node
# repeat for wallet, sportsbook, games-provablyfair
```

This approach gives live reload and easier debug.

---

# 6) Troubleshooting & tips

* If `pg` connection errors: verify `DATABASE_URL` in `.env` and that Postgres container is healthy (`docker ps` + `docker-compose logs postgres`).
* If TypeScript build fails: run `yarn`/`pnpm` in that service folder to install dev deps (`typescript`, `ts-node`).
* If ports are busy: change ports in `docker/local.yml` and in `.env`.
* Want logs per service: `docker-compose -f docker/local.yml logs -f api-gateway` (or `auth`, `wallet`, etc).
* To run migrations inside Docker post-start, use a lightweight migration container or `psql` from host pointed at containerized DB.

---

# 7) Next-phase: hardening & connect-the-dots 

* Implement idempotency & retries for payment webhooks.
* Add JWT RS256 keys & rotate refresh tokens with revocation.
* Replace HMAC RNG with Chainlink VRF / HSM + publish proofs to S3 with signed manifest.
* Hook in a real odds feed (Sportradar/Betradar) with rate-limiting and licensing.
* Integrate Stripe/Adyen for fiat and Coinbase Commerce / CoinsPaid / BTCPay for crypto.
* Add advanced unit/integration tests and nightly reconciliation jobs.
* Add RBAC to Admin panel and rate-limit exposure.

---

# TL;DR (one-liner)

1. `cp .env.example .env`
2. `psql "$DATABASE_URL" -f infra/migrations/001_init.sql` (or run DB container and then migrate)
3. `docker-compose -f docker/local.yml up --build`
4. Smoke-test with those curl commands (signup/login/ledger/place bet/seed spin)

You’re live. If you want, I’ll now:

* generate a runnable `make migrate` or `migrate` container entry so migrations run automatically on `docker-compose up`, **or**
* fully flesh out one service to production-level (pick: `wallet`, `sportsbook`, or `games-provablyfair`) with tests, lint, and full error handling.

Which one do you want me to harden next? Wallet, Sportsbook, or Games?
