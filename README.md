<div align="center">

#  TxFort

### Autonomous Payment Security for the x402 Protocol

A local security guard and Red/Blue adversarial evaluation suite that protects AI agent wallets from overpayment and wrong-party attacks on Base Sepolia.

[Live Dashboard](https://bios-thapar.vercel.app/) · [Backend API](https://txfort-api.onrender.com) · [Merchant Server](https://merchant-server-4w6t.onrender.com)

[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](https://opensource.org/licenses/ISC)
[![Network: Base Sepolia](https://img.shields.io/badge/Network-Base%20Sepolia-blue?style=for-the-badge)](https://sepolia.basescan.org)
[![Protocol: x402 v2](https://img.shields.io/badge/Protocol-x402%20v2-orange?style=for-the-badge)](https://x402.org)
[![Node.js: 20+](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)

</div>

---

##  Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Running the Application](#-running-the-application)
- [How the Payment Guard Works](#-how-the-payment-guard-works)
- [Red Team Attack Suite](#-red-team-attack-suite)
- [Cross-Team Evaluator API](#-cross-team-evaluator-api-x402_red_blue_v1)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [SDG Alignment](#-sdg-164-alignment)
- [Known Limitations](#-known-limitations)
- [Contributing](#-contributing)
- [License](#-license)

---

##  Overview

**TxFort** stops AI agents from draining their wallets when paying for web resources through the [x402 protocol](https://x402.org). It sits between an autonomous agent and merchant payment challenges, inspecting **budget caps**, **recipient addresses**, **allowed assets**, and **network parameters** — all *before* the agent can authorize a cryptographic transfer.

> **Built for the BIOS Hackathon 2026** — x402 Red/Blue challenge track.

### Key Capabilities

| Capability | Description |
|---|---|
|  **Blue Team Guard** | Pre-signing payment validation with 10+ configurable policy checks |
| **Red Team Runner** | 28 adversarial attack scenarios executed against the guard |
|  **Cross-Team Evaluator** | Public API for external teams to benchmark their guards |
|  **Live x402 Payments** | End-to-end EIP-712 payment signing on Base Sepolia testnet |
|  **Security Dashboard** | React-based console with run history, metrics, and team insights |
|  **Atomic Spending Reservations** | MongoDB-backed transactional budget accounting with idempotency |

---

##  Problem Statement

> *"Guard an AI agent's crypto wallet on the x402 payment protocol against overpayment and wrong-party attacks, then test other teams' guards."*

Autonomous agents can request and make machine-to-machine payments. A malicious merchant, inflated price, or altered recipient can turn that convenience into financial risk. TxFort ensures every payment challenge is validated against a strict local policy before any cryptographic signing occurs.

---

##  Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        TXFORT ARCHITECTURE                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐     HTTP 402      ┌──────────────────┐            │
│   │  AI Agent    │ ───────────────── │  Merchant Server │            │
│   │  (x402 SDK)  │    Challenge      │  (sellerServer)  │            │
│   └──────┬───────┘                   └────────┬─────────┘            │
│          │                                    │                      │
│          │  Payment Challenge                 │  x402 Middleware     │
│          ▼                                    │                      │
│   ┌──────────────────┐                        │                      │
│   │  TXFORT GUARD    │                        │                      │
│   │  (paymentGuard)  │                        │                      │
│   │                  │                        │                      │
│   │  ├─ Version ✓    │                        │                      │
│   │  ├─ Merchant ✓   │                        │                      │
│   │  ├─ Scheme ✓     │                        │                      │
│   │  ├─ Network ✓    │                        │                      │
│   │  ├─ Token ✓      │                        │                      │
│   │  ├─ Recipient ✓  │                        │                      │
│   │  ├─ Amount ✓     │                        │                      │
│   │  └─ Timeout ✓    │                        │                      │
│   └──────┬───────────┘                        │                      │
│          │                                    │                      │
│    ALLOW │ BLOCK                              │                      │
│          ▼                                    │                      │
│   ┌──────────────────┐    EIP-712     ┌───────┴─────────┐           │
│   │  Spending        │ ──────────────►│  x402 Facilitator│           │
│   │  Reservation     │    Signed      │  (settlement)    │           │
│   │  (MongoDB)       │    Payment     └─────────────────┘           │
│   └──────────────────┘                                               │
│                                                                      │
│   ┌──────────────────┐    ┌──────────────────┐                      │
│   │  Red Team Runner │    │  React Dashboard │                      │
│   │  (28 attacks)    │    │  (Vite + TW4)    │                      │
│   └──────────────────┘    └──────────────────┘                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Agent** requests a paid resource from the merchant server
2. **Merchant** returns an HTTP 402 response with an x402 V2 payment challenge
3. **TxFort Guard** intercepts the challenge via the `onBeforePaymentCreation` hook
4. **Policy Engine** validates merchant trust, amounts, recipients, networks, assets, and timeouts
5. If **APPROVED**: an atomic MongoDB spending reservation is created, the agent signs an EIP-712 transfer, and the payment header is sent to the facilitator for settlement
6. If **BLOCKED**: the agent receives detailed error codes and no signing occurs

---

##  Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 20+** | Runtime |
| **Express 5** | HTTP API framework |
| **MongoDB + Mongoose 9** | User auth, spending reservations, evaluation history |
| **viem** | EVM wallet operations, EIP-712 signing, address validation |
| **@x402/*** | x402 protocol SDK (core, evm, express middleware, fetch client) |
| **Zod** | Request validation |
| **Helmet + CORS + Rate Limiting** | API security |
| **JWT (jsonwebtoken)** | Dashboard authentication |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool and dev server |
| **Tailwind CSS 4** | Styling |
| **Recharts** | Data visualization |
| **React Router 7** | Client-side routing |
| **Lucide React** | Icon set |
| **Axios** | HTTP client |

### Blockchain
| Technology | Purpose |
|---|---|
| **Hardhat** | Smart contract development framework |
| **Base Sepolia (EIP-155:84532)** | Target testnet |
| **USDC (0x036CbD…)** | Payment token |

### DevOps
| Technology | Purpose |
|---|---|
| **Vercel** | Frontend deployment |
| **Render** | Backend + merchant server deployment |

---

##  Project Structure

```
BIOS_Thapar/
├── README.md
├── render.yaml                    # Render deployment config (backend + merchant)
│
└── sentinel-402/
    ├── backend/
    │   ├── package.json
    │   ├── .env.example
    │   ├── scripts/
    │   │   ├── test-sentinel-local.mjs     # Local integration test
    │   │   └── sentinel-local-attack.mjs   # Local attack simulation
    │   ├── src/
    │   │   ├── server.js                   # Main API entry point (port 5000)
    │   │   ├── sellerServer.js             # Mock merchant server (port 5001)
    │   │   ├── app.js                      # Express app config & middleware
    │   │   ├── config/
    │   │   │   └── database.js             # MongoDB connection
    │   │   ├── controllers/
    │   │   │   ├── agentController.js       # Agent payment endpoint
    │   │   │   └── paymentControllers.js    # Payment evaluation endpoints
    │   │   ├── middleware/
    │   │   │   └── authMiddleware.js        # JWT authentication
    │   │   ├── models/
    │   │   │   ├── User.js                  # User accounts
    │   │   │   ├── AttackRun.js             # Red team run history
    │   │   │   ├── EvaluatorRun.js          # Evaluator run history
    │   │   │   └── paymentModels.js         # SpendCounter + PaymentReservation
    │   │   ├── routes/
    │   │   │   ├── agentRoutes.js           # POST /api/agent/weather
    │   │   │   ├── paymentRoutes.js         # Payment evaluation
    │   │   │   ├── redBlueRoutes.js         # Red/Blue team endpoints
    │   │   │   ├── evaluatorRoutes.js       # Cross-team evaluator API
    │   │   │   └── authRoutes.js            # Login/register
    │   │   └── services/
    │   │       ├── guard/
    │   │       │   ├── paymentGuard.js      # ⭐ Core security guard engine
    │   │       │   ├── demoPolicy.js        # Default policy configuration
    │   │       │   ├── redTeamCases.js      # 28 adversarial attack definitions
    │   │       │   ├── redTeamRunner.js     # CLI red team executor
    │   │       │   ├── spendingReservationService.js  # Atomic budget accounting
    │   │       │   └── validators/          # Individual validation modules
    │   │       │       ├── amountValidator.js
    │   │       │       ├── assetValidator.js
    │   │       │       ├── networkValidator.js
    │   │       │       └── recipientValidator.js
    │   │       ├── evaluator/
    │   │       │   └── evaluatorEngine.js   # Cross-team evaluation engine
    │   │       └── x402/
    │   │           └── guardedAgent.js      # Full x402 payment lifecycle
    │   └── tests/
    │       ├── paymentGuard.test.js          # Guard unit tests
    │       └── redTeam.test.js              # Red team attack tests
    │
    ├── frontend/
    │   ├── package.json
    │   ├── .env.example
    │   ├── index.html
    │   ├── vite.config.js
    │   ├── vercel.json
    │   └── src/
    │       ├── main.jsx                     # React entry point
    │       ├── App.jsx                      # Router + layout
    │       ├── index.css                    # Global styles
    │       ├── context/
    │       │   └── AuthContext.jsx           # Authentication state
    │       ├── hooks/
    │       │   └── useSecurityData.js        # Security data hooks
    │       ├── lib/
    │       │   └── api.js                   # Axios API client
    │       ├── layout/
    │       │   └── AppLayout.jsx            # Dashboard shell
    │       ├── components/
    │       │   ├── AttackTable.jsx           # Attack results table
    │       │   ├── MetricCard.jsx            # Dashboard metric cards
    │       │   ├── RunHistory.jsx            # Historical runs
    │       │   ├── SecurityOrb.jsx           # Security score visualization
    │       │   ├── Sidebar.jsx              # Navigation sidebar
    │       │   └── Topbar.jsx               # Top navigation bar
    │       └── pages/
    │           ├── HomePage.jsx             # Landing page
    │           ├── AuthPage.jsx             # Login/register
    │           ├── Dashboard.jsx            # Overview dashboard
    │           ├── RedTeam.jsx              # Red team console
    │           ├── BlueTeam.jsx             # Blue team console
    │           ├── Evaluator.jsx            # Cross-team evaluator
    │           ├── Payments.jsx             # Payment management
    │           ├── Activity.jsx             # Activity log
    │           └── Settings.jsx             # User settings
    │
    └── blockchain/
        ├── package.json
        ├── hardhat.config.js
        ├── contracts/
        │   └── Lock.sol                     # Hardhat starter contract
        ├── ignition/modules/
        │   └── Lock.js
        └── test/
            └── Lock.js
```

---

##  Getting Started

### Prerequisites

- **Node.js** 20+ and **npm**
- **MongoDB** (required for API server; not needed for offline tests)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/snischay2/BIOS_Thapar.git
cd BIOS_Thapar
```

### 2. Install Backend Dependencies

```bash
cd sentinel-402/backend
npm install
```

### 3. Verify with Tests (No Config Required)

Run the unit test suite immediately — no database or API keys needed:

```bash
npm test
```

### 4. Run the Red Team Attack Simulation

Execute 28 adversarial attack scenarios plus a legitimate control against the guard:

```bash
node src/services/guard/redTeamRunner.js
```

### 5. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 6. Configure Environment Variables

#### Backend (`sentinel-402/backend/.env`)

```bash
cd ../backend
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Random secret for login tokens | — |
| `MERCHANT_ORIGIN` | Merchant server URL | `http://localhost:5001` |
| `MERCHANT_PAY_TO` | Merchant receiving wallet | `0x179f0073e4105b37dadb28e87D581Aa443D81986` |
| `FACILITATOR_URL` | x402 facilitator endpoint | `https://x402.org/facilitator` |
| `EVM_PRIVATE_KEY` | Agent wallet signing key (testnet only!) | — |
| `CLIENT_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `TRUST_PROXY` | Set `true` behind a reverse proxy | `false` |

#### Frontend (`sentinel-402/frontend/.env`)

```bash
cd ../frontend
cp .env.example .env
```

For local development:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_MERCHANT_BASE_URL=http://localhost:5001
```

### 7. Generate a Testnet Wallet (Optional — For Live Payments)

>  **Never use a wallet with mainnet funds.**

```bash
# Generate a disposable private key
node -e "console.log('0x' + crypto.randomBytes(32).toString('hex'))"

# Find the corresponding address
node -e "import('viem/accounts').then(m => console.log(m.privateKeyToAccount(process.argv[1]).address))" 0x<your-key>
```

Set `EVM_PRIVATE_KEY` in your backend `.env` and fund the address with Base Sepolia testnet ETH and USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`).

---

## ▶Running the Application

Start the full stack across three terminals:

### Terminal 1 — Backend API (Port 5000)

```bash
cd sentinel-402/backend
npm run dev
```

### Terminal 2 — Mock Merchant Server (Port 5001)

```bash
cd sentinel-402/backend
npm run seller
```

### Terminal 3 — Frontend Dashboard (Port 5173)

```bash
cd sentinel-402/frontend
npm run dev
```

Visit **http://localhost:5173** to open the dashboard.

### Trigger an Agent Payment

```bash
curl -X POST http://localhost:5000/api/agent/weather
```

**What happens:**

1. Agent requests paid data from the merchant at `http://localhost:5001/weather`
2. Merchant returns an HTTP 402 challenge with payment requirements
3. TxFort Guard evaluates the challenge against the security policy
4. If approved, the agent signs an EIP-712 transfer via `viem` on Base Sepolia
5. The signed payment header is sent to the merchant, verified by the x402 facilitator, and the paid weather data is returned

---

##  How the Payment Guard Works

When an HTTP 402 challenge arrives, [`paymentGuard.js`](sentinel-402/backend/src/services/guard/paymentGuard.js) evaluates every payment option against local policy **before any signing**:

| Check | Rule | Block Condition |
|---|---|---|
| **Protocol Version** | `x402Version === 2` | Older or unversioned challenges |
| **Merchant Origin** | HTTPS required (HTTP allowed for localhost) | Untrusted origin, embedded URL credentials |
| **Payment Scheme** | Must be in `allowedSchemes` | Unsupported scheme (e.g., `transfer`) |
| **Blockchain Network** | Must match `eip155:84532` (Base Sepolia) | Wrong chain ID |
| **Token Asset** | Must match approved USDC address | Unapproved or malformed token |
| **Recipient Address** | Must match merchant `expectedPayTo` + allowlist | Attacker wallet, tampered recipient |
| **Payment Amount** | Positive integer string ≤ `maxPaymentAtomic` (0.50 USDC) | Negative, decimal, scientific, zero, or over-limit |
| **Daily Budget** | `spentToday + amount ≤ dailyLimit` (2.00 USDC) | Daily limit exceeded |
| **Timeout** | Positive safe integer ≤ 300 seconds | Fractional, negative, or excessive timeout |
| **Candidate Selection** | Filters invalid options, selects cheapest approved | All options fail |

---

## Red Team Attack Suite

28 adversarial scenarios targeting every guard rule:

```
========== TXFORT RED TEAM ==========

Legitimate payment control: ALLOW
┌─────────┬────────────────────────────────┬───────────┐
│ (index) │ attack                         │ result    │
├─────────┼────────────────────────────────┼───────────┤
│ 0       │ 'OVER_TX_LIMIT'                │ 'BLOCKED' │
│ 1       │ 'DAILY_LIMIT_BYPASS'           │ 'BLOCKED' │
│ 2       │ 'WRONG_RECIPIENT'              │ 'BLOCKED' │
│ 3       │ 'UNTRUSTED_MERCHANT'           │ 'BLOCKED' │
│ 4       │ 'WRONG_NETWORK'                │ 'BLOCKED' │
│ 5       │ 'UNAPPROVED_ASSET'             │ 'BLOCKED' │
│ 6       │ 'UNSUPPORTED_SCHEME'           │ 'BLOCKED' │
│ 7       │ 'TIMEOUT_TOO_LONG'             │ 'BLOCKED' │
│ 8       │ 'WRONG_VERSION'                │ 'BLOCKED' │
│ 9       │ 'NUMERIC_AMOUNT'               │ 'BLOCKED' │
│ 10      │ 'ZERO_AMOUNT'                  │ 'BLOCKED' │
│ 11      │ 'NEGATIVE_AMOUNT'              │ 'BLOCKED' │
│ 12      │ 'DECIMAL_AMOUNT'               │ 'BLOCKED' │
│ 13      │ 'SCIENTIFIC_AMOUNT'            │ 'BLOCKED' │
│ 14      │ 'MALFORMED_ASSET'              │ 'BLOCKED' │
│ 15      │ 'MALFORMED_RECIPIENT'          │ 'BLOCKED' │
│ 16      │ 'FRACTIONAL_TIMEOUT'           │ 'BLOCKED' │
│ 17      │ 'EMPTY_OPTIONS'                │ 'BLOCKED' │
│ 18      │ 'MISSING_OPTIONS'              │ 'BLOCKED' │
│ 19      │ 'MISSING_RESOURCE_URL'         │ 'BLOCKED' │
│ 20      │ 'MALFORMED_RESOURCE_URL'       │ 'BLOCKED' │
│ 21      │ 'REMOTE_HTTP'                  │ 'BLOCKED' │
│ 22      │ 'URL_CREDENTIALS'              │ 'BLOCKED' │
│ 23      │ 'EMPTY_MERCHANT_REGISTRY'      │ 'BLOCKED' │
│ 24      │ 'MERCHANT_RECIPIENT_TAMPERING' │ 'BLOCKED' │
│ 25      │ 'EMPTY_ALLOWED_RECIPIENTS'     │ 'BLOCKED' │
│ 26      │ 'INVALID_POLICY_LIMIT'         │ 'BLOCKED' │
│ 27      │ 'NULL_PAYMENT_OPTION'          │ 'BLOCKED' │
└─────────┴────────────────────────────────┴───────────┘

=============== SUMMARY ===============
Attacks blocked: 28/28
Attacks not blocked: 0
Legitimate control: ALLOW
=======================================

RED TEAM RESULT: ALL TESTED ATTACKS BLOCKED
```

### Attack Categories

| Category | Attacks | Examples |
|---|---|---|
| **Financial** | Amount manipulation | Over-limit, zero, negative, decimal, scientific notation |
| **Identity** | Recipient tampering | Wrong wallet, malformed address, registry tampering |
| **Protocol** | x402 violations | Wrong version, unsupported scheme, invalid timeouts |
| **Network** | Chain/asset attacks | Wrong network, unapproved token, malformed asset |
| **Merchant** | Origin spoofing | Fake merchant, insecure HTTP, URL credentials |
| **Structural** | Malformed payloads | Empty/missing options, null entries, missing URLs |

---

## Cross-Team Evaluator API (X402_RED_BLUE_V1)

TxFort exposes a public evaluation endpoint for external teams to benchmark their attack vectors against the guard.

### Assess a Challenge

```bash
curl -X POST http://localhost:5000/api/evaluator/v1/assess \
  -H "Content-Type: application/json" \
  -d '{
    "protocol": "X402_RED_BLUE_V1",
    "teamName": "ExternalAuditor",
    "caseId": "TEST_01",
    "paymentRequired": {
      "x402Version": 2,
      "resource": { "url": "http://localhost:5001/weather" },
      "accepts": [{
        "scheme": "exact",
        "network": "eip155:84532",
        "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        "amount": "100000",
        "payTo": "0x179f0073e4105b37dadb28e87D581Aa443D81986",
        "maxTimeoutSeconds": 300
      }]
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "protocol": "X402_RED_BLUE_V1",
  "guard": "TXFORT-402",
  "decision": "ALLOW",
  "approved": true,
  "reasons": ["APPROVED"],
  "primaryReason": "NONE"
}
```

---

## API Reference

### Health & Discovery

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/evaluator/info` | Protocol details and fixture endpoints |
| `GET` | `/api/evaluator/v1/health` | Evaluator protocol discovery |
| `GET` | `/api/evaluator/v1/fixture` | Safe sample challenge payload |
| `GET` | `/api/evaluator/v1/suite` | Full public test suite |

### Core Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/payment/evaluate` | Evaluate a payment challenge | — |
| `POST` | `/api/agent/weather` | Trigger a guarded agent payment | — |
| `POST` | `/api/evaluator/v1/assess` | Assess incoming challenge | — |
| `POST` | `/api/red-blue/run` | Execute Red/Blue simulation | JWT |
| `POST` | `/api/auth/register` | Create account | — |
| `POST` | `/api/auth/login` | Login | — |

### Dashboard Pages

| Route | Page | Description |
|---|---|---|
| `/` | Home | Landing page |
| `/dashboard` | Overview | Security metrics & summary |
| `/red-team` | Red Team | Adversarial attack console |
| `/blue-team` | Blue Team | Guard policy inspection |
| `/evaluator` | Evaluator | Cross-team evaluation runner |
| `/payments` | Payments | Payment history & agent wallet |
| `/activity` | Activity | Run history log |
| `/settings` | Settings | User preferences |

---

##  Testing

### Backend Unit Tests

Runs all unit tests covering deterministic guards, input mutations, and red team attacks:

```bash
cd sentinel-402/backend
npm test
```

### In-Memory Red Team Runner

Runs the 28-attack adversarial scenario runner and prints the decision table:

```bash
cd sentinel-402/backend
node src/services/guard/redTeamRunner.js
```

### Cross-Team Evaluator Suite

Runs the evaluator test suite against a running local backend:

```bash
cd sentinel-402/backend
npm run test:evaluator
```

### Frontend Build & Lint

Verifies the React build and checks for lint issues:

```bash
cd sentinel-402/frontend
npm run build
npm run lint
```

---

##  Deployment

| Service | Platform | URL |
|---|---|---|
| **Dashboard** | Vercel | https://bios-thapar.vercel.app |
| **Backend API** | Render | https://txfort-api.onrender.com |
| **Merchant Server** | Render | https://merchant-server-4w6t.onrender.com |

The `render.yaml` in the repo root defines both Render web services for one-click deployment.

---

##  SDG 16.4 Alignment

**SDG Target 16.4** calls for reducing illicit financial flows and combating organized crime. As autonomous agents become able to move digital value, clear authorization policies, trusted recipients, and verifiable settlement evidence become important safeguards.

TxFort contributes to this goal by enforcing:

- **Wallet-level payment controls** — no transaction signed without explicit policy approval
- **Recipient allowlists** — payments only to verified, trusted merchant addresses
- **Daily spending budgets** — hard limits on autonomous spending with atomic reservation accounting
- **Adversarial testing** — continuous evaluation against known attack patterns

> TxFort is a prototype contributing to SDG 16.4, not a complete solution to illicit financial flows.

---

##  Known Limitations

- **Network scope**: Current policy targets Base Sepolia testnet (`eip155:84532`) with USDC only. Multi-network routing is not configured.
- **Database dependency**: Running the Express API with user accounts and saved simulation runs requires a reachable MongoDB instance. Core tests and the red team runner execute in-memory without a database.
- **Private key for live transactions**: Broadcasting real transactions on Base Sepolia requires a funded `EVM_PRIVATE_KEY` and running the mock merchant server (`npm run seller`).
- **Single agent**: The current demo supports one agent identity (`agent-001`). Multi-agent orchestration is not implemented.

---

##  Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Commit** your changes (`git commit -m 'Add your feature'`)
4. **Push** to the branch (`git push origin feature/your-feature`)
5. **Open** a Pull Request

---

##  License

This project is licensed under the **ISC License** — see the [LICENSE](https://opensource.org/licenses/ISC) file for details.

---

<div align="center">

**Built with  for the BIOS Hackathon 2026**

*x402 Red/Blue · SDG 16.4 · Base Sepolia*

</div>
