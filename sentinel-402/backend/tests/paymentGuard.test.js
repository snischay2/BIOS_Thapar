
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
    url: "http://localhost:5001/weather"
  },
  accepts: [
    {
      scheme: "exact",
      network: "eip155:84532",
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      amount: "100000",
      payTo: "0x179f0073e4105b37dadb28e87D581Aa443D81986",
      maxTimeoutSeconds: 300
    }
  ]
};


function evaluate(challenge, policy = demoPolicy, merchants = demoMerchants) {
  return evaluatePaymentRequired({
    paymentRequired: challenge,
    policy,
    merchants
  });
}

function mutate(fn) {
  const challenge = structuredClone(validChallenge);
  fn(challenge);
  return challenge;
}

// 1
test("allows legitimate payment", () => {
  assert.equal(evaluate(validChallenge).approved, true);
});

// 2
test("blocks excessive payment", () => {
  const result = evaluate(mutate(c => {
    c.accepts[0].amount = "600000";
  }));
  assert.ok(result.reasons.some(e => e.code === "PAYMENT_LIMIT_EXCEEDED"));
});

// 3
test("blocks wrong recipient", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].payTo = "0x3333333333333333333333333333333333333333";
  })).approved, false);
});

// 4
test("blocks unauthorized network", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].network = "eip155:1";
  })).approved, false);
});

// 5
test("blocks unapproved token", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].asset = "0x3333333333333333333333333333333333333333";
  })).approved, false);
});

// 6
test("blocks untrusted merchant", () => {
  assert.equal(evaluate(mutate(c => {
    c.resource.url = "https://attacker.example.com/pay";
  })).approved, false);
});

// 7
test("blocks invalid protocol version", () => {
  assert.equal(evaluate(mutate(c => {
    c.x402Version = 1;
  })).approved, false);
});

// 8
test("blocks unsupported scheme", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].scheme = "unknown";
  })).approved, false);
});

// 9
test("blocks daily spending limit breach", () => {
  const policy = {
    ...demoPolicy,
    spentTodayAtomic: "1950000"
  };
  assert.equal(evaluate(validChallenge, policy).approved, false);
});

// 10
test("blocks invalid timeout", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].maxTimeoutSeconds = 9999;
  })).approved, false);
});

// 11
test("selects cheapest approved option", () => {
  const challenge = mutate(c => {
    c.accepts.push({
      ...c.accepts[0],
      amount: "50000"
    });
  });
  const result = evaluate(challenge);
  assert.equal(result.selectedRequirement.amount, "50000");
});

// 12
test("blocks missing payment options", () => {
  assert.equal(evaluate({
    x402Version: 2,
    resource: validChallenge.resource,
    accepts: []
  }).approved, false);
});

// 13
test("blocks missing challenge", () => {
  assert.equal(evaluate(null).approved, false);
});

// 14
test("blocks missing resource URL", () => {
  assert.equal(evaluate({
    ...validChallenge,
    resource: {}
  }).approved, false);
});

// 15
test("blocks malformed resource URL", () => {
  assert.equal(evaluate(mutate(c => {
    c.resource.url = "not-a-url";
  })).approved, false);
});

// 16
test("blocks HTTP non-local merchant", () => {
  assert.equal(evaluate(mutate(c => {
    c.resource.url = "http://weather.example.com/pay";
  })).approved, false);
});

// 17
test("blocks URL containing credentials", () => {
  assert.equal(evaluate(mutate(c => {
    c.resource.url = "https://user:password@weather.example.com/pay";
  })).approved, false);
});

// 18
test("blocks numeric amount instead of string", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].amount = 100000;
  })).approved, false);
});

// 19
test("blocks zero payment", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].amount = "0";
  })).approved, false);
});

// 20
test("blocks negative payment", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].amount = "-100";
  })).approved, false);
});

// 21
test("blocks decimal payment amount", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].amount = "0.001";
  })).approved, false);
});

// 22
test("blocks malformed token address", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].asset = "not-an-address";
  })).approved, false);
});

// 23
test("blocks malformed recipient address", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].payTo = "attacker";
  })).approved, false);
});

// 24
test("blocks zero timeout", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].maxTimeoutSeconds = 0;
  })).approved, false);
});

// 25
test("blocks fractional timeout", () => {
  assert.equal(evaluate(mutate(c => {
    c.accepts[0].maxTimeoutSeconds = 30.5;
  })).approved, false);
});

// 26
test("blocks malformed policy", () => {
  const policy = {
    ...demoPolicy,
    allowedAssets: null
  };
  assert.equal(evaluate(validChallenge, policy).approved, false);
});

// 27
test("blocks unavailable merchant registry", () => {
  assert.equal(evaluate(validChallenge, demoPolicy, null).approved, false);
});

// 28
test("blocks null payment option", () => {
  const challenge = mutate(c => {
    c.accepts = [null];
  });
  assert.equal(evaluate(challenge).approved, false);
});

// 29
test("blocks empty payment option", () => {
  const challenge = mutate(c => {
    c.accepts = [{}];
  });
  assert.equal(evaluate(challenge).approved, false);
});

// 30
test("blocks payment above daily budget", () => {
  const policy = {
    ...demoPolicy,
    spentTodayAtomic: "1999999"
  };
  assert.equal(evaluate(validChallenge, policy).approved, false);
});

// 31
test("allows exact daily budget boundary", () => {
  const policy = {
    ...demoPolicy,
    spentTodayAtomic: "1900000"
  };
  assert.equal(evaluate(validChallenge, policy).approved, true);
});

// 32
test("blocks all malicious options when no option is approved", () => {
  const challenge = mutate(c => {
    c.accepts = [
      { ...c.accepts[0], amount: "999999999" },
      { ...c.accepts[0], network: "eip155:1" }
    ];
  });
  assert.equal(evaluate(challenge).approved, false);
});
