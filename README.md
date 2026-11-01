<div align="center">

# TxFort

Local security guard and Red/Blue evaluation suite for autonomous x402 agent payments on Base Sepolia.

[Live Dashboard](https://bios-thapar.vercel.app/)

[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](https://opensource.org/licenses/ISC)
[![Network: Base Sepolia](https://img.shields.io/badge/Network-Base%20Sepolia-blue?style=for-the-badge)](https://sepolia.basescan.org)
[![Protocol: x402 v2](https://img.shields.io/badge/Protocol-x402%20v2-orange?style=for-the-badge)](https://x402.org)

</div>

## What is this?

TxFort stops AI agents from draining their wallets when paying for web resources through the x402 protocol. It sits between an agent and merchant payment challenges, checking budget caps, recipient addresses, and allowed assets before the agent can authorize a transfer.

## Quick start

You need Node.js 20+ and npm installed.

### 1. Clone and install backend dependencies

```bash
git clone https://github.com/snischay2/BIOS_Thapar.git
cd BIOS_Thapar/sentinel-402/backend
npm install
```

### 2. Run the test suite

You can verify the security guard rules immediately without configuring databases or API keys:

```bash
npm test
```

### 3. Run the local Red Team attack simulation

This executes 28 adversarial attack scenarios plus a legitimate control payment against the guard:

```bash
node src/services/guard/redTeamRunner.js
```

### 4. Install frontend dependencies and build

```bash
cd ../frontend
npm install
npm run build
```

### 5. Configure environment and agent wallet

To run the web services locally, configure the backend and frontend environment files:

#### Backend configuration

Copy `.env.example` to `.env` in `sentinel-402/backend`:

```bash
cd ../backend
cp .env.example .env
```

Key environment variables:
- `PORT`: Server port (default: `5000`).
- `MONGODB_URI`: Connection string for user authentication and simulation history.
- `JWT_SECRET`: Random secret for dashboard login tokens.
- `MERCHANT_PAY_TO`: EVM wallet address of the merchant resource server (`0x179f0073e4105b37dadb28e87D581Aa443D81986`).
- `EVM_PRIVATE_KEY`: Agent signing key for live onchain payments.

If you want the agent to execute real payments on Base Sepolia (`POST /api/agent/weather`), set `EVM_PRIVATE_KEY`:

1. Generate a disposable testnet private key (never use a wallet with mainnet funds):
   ```bash
   node -e "console.log('0x' + crypto.randomBytes(32).toString('hex'))"
   ```
2. Find the corresponding address:
   ```bash
   node -e "import('viem/accounts').then(m => console.log(m.privateKeyToAccount(process.argv[1]).address))" 0x<your-private-key>
   ```
3. Set the key in `sentinel-402/backend/.env`:
   ```env
   EVM_PRIVATE_KEY=0x<your-64-hex-character-key>
   ```
4. Fund this address with Base Sepolia testnet ETH for gas, plus testnet USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`). Offline unit tests and red team simulations run without any private key or funds.

#### Frontend configuration

Copy `.env.example` to `.env` in `sentinel-402/frontend`:

```bash
cd ../frontend
cp .env.example .env
```

For local development, point to your local backend and seller servers:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_MERCHANT_BASE_URL=http://localhost:5001
```

### 6. Start the local servers

You can run the full stack across three terminal tabs:

1. **Backend API (port 5000)**:
   ```bash
   cd sentinel-402/backend
   npm run dev
   ```

2. **Mock Merchant Server (port 5001)**:
   This runs an x402 resource server offering a paid weather endpoint (`/weather`):
   ```bash
   cd sentinel-402/backend
   npm run seller
   ```

3. **Frontend Dashboard (port 5173)**:
   ```bash
   cd sentinel-402/frontend
   npm run dev
   ```

Visit `http://localhost:5173` to open the local dashboard.

## Running an autonomous guarded payment

Once the backend and seller servers are running, trigger an agent payment:

```bash
curl -X POST http://localhost:5000/api/agent/weather
```

What happens step-by-step:
1. The agent requests paid data from the mock merchant at `http://localhost:5001/weather`.
2. The merchant returns an HTTP 402 challenge with payment requirements.
3. The agent passes the challenge to `paymentGuard.js` for evaluation.
4. If approved, the agent signs an EIP-712 transfer with `viem` using `EVM_PRIVATE_KEY` on Base Sepolia.
5. The signed payment header is sent back to the merchant, verified via the x402 facilitator, and the paid weather payload is returned.

## Cross-team Evaluator API (X402_RED_BLUE_V1)

TxFort implements a public evaluation endpoint so external teams or automated evaluators can benchmark their attack vectors against our guard without signing or broadcasting transactions.

### Assess a challenge

Send an x402 challenge payload to `/api/evaluator/v1/assess`:

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

Response:

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

Additional evaluator endpoints:
- `GET /api/evaluator/info`: Protocol details and fixture endpoints.
- `GET /api/evaluator/v1/health`: Protocol discovery handshake.
- `GET /api/evaluator/v1/fixture`: Safe sample challenge payload.
- `GET /api/evaluator/v1/suite`: Public suite of test challenges.

## Real example and output

Terminal output from running `node src/services/guard/redTeamRunner.js` directly against the guard policy:

```text
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

## How the checks work

When an HTTP 402 challenge arrives, `paymentGuard.js` evaluates every payment option against local policy before any signing operation takes place:

- Protocol version: Requires `x402Version === 2`. Older or unversioned challenges are blocked immediately.
- Merchant origin: Checks that the resource URL uses HTTPS (or local HTTP during development), contains no embedded credentials in the URL, and matches a registered merchant in `demoMerchants`.
- Scheme: Verifies that the payment scheme is listed in `allowedSchemes` (configured for `exact`).
- Network and token: Confirms the blockchain network matches Base Sepolia (`eip155:84532`) and the token address matches approved USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`).
- Payee match: Checks that `payTo` matches the merchant's expected receiving address and is present in the `allowedRecipients` allowlist.
- Amount limits: Rejects negative numbers, decimals, scientific notation, and non-string amounts. Verifies the amount stays within `maxPaymentAtomic` (0.50 USDC) and does not push `spentTodayAtomic` over `dailyLimitAtomic` (2.00 USDC).
- Timeout limits: Ensures `maxTimeoutSeconds` is a positive safe integer within policy limits (300 seconds).
- Candidate selection: If multiple payment options are offered, the guard filters out invalid options and selects the cheapest approved option. If all options fail, the guard returns a BLOCK decision along with specific error codes.

## Project structure

```
sentinel-402/
├── backend/
│   ├── scripts/          # Attack runners and evaluator challenge tests
│   ├── src/
│   │   ├── config/       # MongoDB connection setup
│   │   ├── controllers/  # Payment, evaluator, and agent controllers
│   │   ├── middleware/   # JWT authentication middleware
│   │   ├── models/       # Mongoose models for users, reservations, and evaluation runs
│   │   ├── routes/       # Express routes for payments, evaluator, agent, and auth
│   │   ├── services/     # Core payment guard, demo policies, and red team runners
│   │   ├── sellerServer.js # Mock merchant resource server running x402 middleware
│   │   └── server.js     # Main backend API entry point
│   └── tests/            # Node.js native test runner suites (61 unit tests)
├── blockchain/
│   ├── contracts/        # Hardhat contracts
│   └── hardhat.config.js # Hardhat configuration
└── frontend/
    ├── src/              # React dashboard pages and components
    ├── index.html        # HTML entry point
    ├── vite.config.js    # Vite configuration
    └── vercel.json       # Vercel deployment configuration
```

## Known limitations

- Network scope: The current policy targets Base Sepolia testnet (`eip155:84532`) with USDC. Multi-network routing is not configured.
- Database requirement for API: Running the Express API server with user accounts and saved simulation runs requires a reachable MongoDB instance. The core test suites and red team runner execute in-memory without a database.
- Private key requirement for live transactions: Broadcasting real transactions on Base Sepolia requires setting a funded `EVM_PRIVATE_KEY` and running the mock merchant server (`npm run seller`).

## How to run the tests

### Backend unit tests (61 tests)

Runs all unit tests covering deterministic guards, input mutations, and red team attacks:

```bash
cd sentinel-402/backend
npm test
```

### In-memory Red Team attack runner

Runs the 28-attack adversarial scenario runner and prints the decision table:

```bash
cd sentinel-402/backend
node src/services/guard/redTeamRunner.js
```

### Cross-team evaluator test suite

Runs the evaluator test suite against a running local backend:

```bash
cd sentinel-402/backend
npm run test:evaluator
```

### Frontend build and lint check

Verifies the React build and checks for lint issues:

```bash
cd sentinel-402/frontend
npm run build
npm run lint
```

## Deployment

- Dashboard: https://bios-thapar.vercel.app/
- Backend API: https://txfort-api.onrender.com
- Mock Merchant Server: https://merchant-server-4w6t.onrender.com
