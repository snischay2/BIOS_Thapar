
import { demoPolicy, demoMerchants } from "./demoPolicy.js";

const MERCHANT_WALLET = "0x179f0073e4105b37dadb28e87D581Aa443D81986";
const BASE_ASSET = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export function createScenario() {
  return {
    paymentRequired: {
      x402Version: 2,
      resource: {
        url: "http://localhost:5001/weather"
      },
      accepts: [
        {
          scheme: "exact",
          network: "eip155:84532",
          asset: BASE_ASSET,
          amount: "100000",
          payTo: MERCHANT_WALLET,
          maxTimeoutSeconds: 300
        }
      ]
    },
    policy: structuredClone(demoPolicy),
    merchants: structuredClone(demoMerchants)
  };
}

export const redTeamAttacks = [
  {
    id: "OVER_TX_LIMIT",
    name: "Payment above per-transaction limit",
    mutate: s => { s.paymentRequired.accepts[0].amount = "500001"; }
  },
  {
    id: "DAILY_LIMIT_BYPASS",
    name: "Payment exceeds remaining daily budget",
    mutate: s => { s.policy.spentTodayAtomic = "1950000"; }
  },
  {
    id: "WRONG_RECIPIENT",
    name: "Payment sent to attacker wallet",
    mutate: s => {
      s.paymentRequired.accepts[0].payTo = "0x2222222222222222222222222222222222222222";
    }
  },
  {
    id: "UNTRUSTED_MERCHANT",
    name: "Fake merchant origin",
    mutate: s => {
      s.paymentRequired.resource.url = "https://attacker.example/weather";
    }
  },
  {
    id: "WRONG_NETWORK",
    name: "Unauthorized blockchain network",
    mutate: s => { s.paymentRequired.accepts[0].network = "eip155:1"; }
  },
  {
    id: "UNAPPROVED_ASSET",
    name: "Unapproved token contract",
    mutate: s => {
      s.paymentRequired.accepts[0].asset = "0x2222222222222222222222222222222222222222";
    }
  },
  {
    id: "UNSUPPORTED_SCHEME",
    name: "Unsupported payment scheme",
    mutate: s => { s.paymentRequired.accepts[0].scheme = "transfer"; }
  },
  {
    id: "TIMEOUT_TOO_LONG",
    name: "Excessive payment timeout",
    mutate: s => { s.paymentRequired.accepts[0].maxTimeoutSeconds = 301; }
  },
  {
    id: "WRONG_VERSION",
    name: "Invalid x402 protocol version",
    mutate: s => { s.paymentRequired.x402Version = 1; }
  },
  {
    id: "NUMERIC_AMOUNT",
    name: "Amount supplied as a number",
    mutate: s => { s.paymentRequired.accepts[0].amount = 100000; }
  },
  {
    id: "ZERO_AMOUNT",
    name: "Zero-value payment",
    mutate: s => { s.paymentRequired.accepts[0].amount = "0"; }
  },
  {
    id: "NEGATIVE_AMOUNT",
    name: "Negative payment amount",
    mutate: s => { s.paymentRequired.accepts[0].amount = "-100"; }
  },
  {
    id: "DECIMAL_AMOUNT",
    name: "Fractional atomic-unit amount",
    mutate: s => { s.paymentRequired.accepts[0].amount = "10.5"; }
  },
  {
    id: "SCIENTIFIC_AMOUNT",
    name: "Scientific notation amount",
    mutate: s => { s.paymentRequired.accepts[0].amount = "1e6"; }
  },
  {
    id: "MALFORMED_ASSET",
    name: "Malformed token address",
    mutate: s => { s.paymentRequired.accepts[0].asset = "not-an-address"; }
  },
  {
    id: "MALFORMED_RECIPIENT",
    name: "Malformed recipient address",
    mutate: s => { s.paymentRequired.accepts[0].payTo = "bad-wallet"; }
  },
  {
    id: "FRACTIONAL_TIMEOUT",
    name: "Fractional timeout value",
    mutate: s => { s.paymentRequired.accepts[0].maxTimeoutSeconds = 2.5; }
  },
  {
    id: "EMPTY_OPTIONS",
    name: "No payment options",
    mutate: s => { s.paymentRequired.accepts = []; }
  },
  {
    id: "MISSING_OPTIONS",
    name: "Missing payment options",
    mutate: s => { delete s.paymentRequired.accepts; }
  },
  {
    id: "MISSING_RESOURCE_URL",
    name: "Missing resource URL",
    mutate: s => { delete s.paymentRequired.resource.url; }
  },
  {
    id: "MALFORMED_RESOURCE_URL",
    name: "Malformed resource URL",
    mutate: s => { s.paymentRequired.resource.url = "://bad-url"; }
  },
  {
    id: "REMOTE_HTTP",
    name: "Insecure non-local HTTP merchant",
    mutate: s => {
      s.paymentRequired.resource.url = "http://attacker.example/weather";
    }
  },
  {
    id: "URL_CREDENTIALS",
    name: "Merchant URL containing credentials",
    mutate: s => {
      s.paymentRequired.resource.url =
        "http://admin:password@localhost:5001/weather";
    }
  },
  {
    id: "EMPTY_MERCHANT_REGISTRY",
    name: "No trusted merchants configured",
    mutate: s => { s.merchants = []; }
  },
  {
    id: "MERCHANT_RECIPIENT_TAMPERING",
    name: "Merchant expected recipient was tampered with",
    mutate: s => {
      s.merchants[0].expectedPayTo =
        "0x2222222222222222222222222222222222222222";
    }
  },
  {
    id: "EMPTY_ALLOWED_RECIPIENTS",
    name: "Recipient removed from policy allowlist",
    mutate: s => { s.policy.allowedRecipients = []; }
  },
  {
    id: "INVALID_POLICY_LIMIT",
    name: "Malformed policy spending limit",
    mutate: s => { s.policy.maxPaymentAtomic = "not-a-number"; }
  },
  {
    id: "NULL_PAYMENT_OPTION",
    name: "Null payment option",
    mutate: s => { s.paymentRequired.accepts = [null]; }
  }
];
