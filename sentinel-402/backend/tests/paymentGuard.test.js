import { test } from "node:test";
import assert from "node:assert/strict";

import {
  evaluatePaymentRequired
} from "../src/services/guard/paymentGuard.js";

import {
  demoPolicy,
  demoMerchants
} from "../src/services/guard/demoPolicy.js";

const validChallenge = {
  x402Version: 2,

  resource: {
    url: "https://weather.example.com/v1/weather"
  },

  accepts: [{
    scheme: "exact",
    network: "eip155:84532",
    asset: "0x2222222222222222222222222222222222222222",
    amount: "100000",
    payTo: "0x1111111111111111111111111111111111111111",
    maxTimeoutSeconds: 300
  }]
};

function evaluate(challenge, policy = demoPolicy) {
  return evaluatePaymentRequired({
    paymentRequired: challenge,
    policy,
    merchants: demoMerchants
  });
}

test("allows legitimate payment", () => {
  const result = evaluate(validChallenge);

  assert.equal(result.approved, true);
  assert.equal(result.decision, "ALLOW");
});

test("blocks excessive payment", () => {
  const challenge = structuredClone(validChallenge);
  challenge.accepts[0].amount = "600000";

  const result = evaluate(challenge);

  assert.equal(result.approved, false);
  assert.ok(result.reasons.some(
    error => error.code === "PAYMENT_LIMIT_EXCEEDED"
  ));
});

test("blocks wrong recipient", () => {
  const challenge = structuredClone(validChallenge);
  challenge.accepts[0].payTo =
    "0x3333333333333333333333333333333333333333";

  assert.equal(evaluate(challenge).approved, false);
});

test("blocks unauthorized network", () => {
  const challenge = structuredClone(validChallenge);
  challenge.accepts[0].network = "eip155:1";

  assert.equal(evaluate(challenge).approved, false);
});

test("blocks unapproved token", () => {
  const challenge = structuredClone(validChallenge);
  challenge.accepts[0].asset =
    "0x3333333333333333333333333333333333333333";

  assert.equal(evaluate(challenge).approved, false);
});

test("blocks untrusted merchant", () => {
  const challenge = structuredClone(validChallenge);
  challenge.resource.url = "https://attacker.example.com/pay";

  assert.equal(evaluate(challenge).approved, false);
});

test("blocks invalid protocol version", () => {
  const challenge = structuredClone(validChallenge);
  challenge.x402Version = 1;

  assert.equal(evaluate(challenge).approved, false);
});

test("blocks unsupported scheme", () => {
  const challenge = structuredClone(validChallenge);
  challenge.accepts[0].scheme = "unknown";

  assert.equal(evaluate(challenge).approved, false);
});

test("blocks daily spending limit breach", () => {
  const policy = {
    ...demoPolicy,
    spentTodayAtomic: "1950000"
  };

  assert.equal(evaluate(validChallenge, policy).approved, false);
});

test("blocks invalid timeout", () => {
  const challenge = structuredClone(validChallenge);
  challenge.accepts[0].maxTimeoutSeconds = 9999;

  assert.equal(evaluate(challenge).approved, false);
});

test("selects the cheapest approved option", () => {
  const challenge = structuredClone(validChallenge);

  challenge.accepts.push({
    ...challenge.accepts[0],
    amount: "50000"
  });

  const result = evaluate(challenge);

  assert.equal(result.approved, true);
  assert.equal(result.selectedRequirement.amount, "50000");
});

test("blocks missing payment options", () => {
  const challenge = {
    x402Version: 2,
    resource: validChallenge.resource,
    accepts: []
  };

  assert.equal(evaluate(challenge).approved, false);
});