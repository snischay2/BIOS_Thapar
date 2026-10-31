
import test from "node:test";
import assert from "node:assert/strict";

import { evaluatePaymentRequired } from "../src/services/guard/paymentGuard.js";
import {
  createScenario,
  redTeamAttacks
} from "../src/services/guard/redTeamCases.js";

function evaluateScenario(scenario) {
  return evaluatePaymentRequired({
    paymentRequired: scenario.paymentRequired,
    policy: scenario.policy,
    merchants: scenario.merchants
  });
}

test("RED TEAM control: legitimate payment is allowed", () => {
  const result = evaluateScenario(createScenario());

  assert.equal(
    result?.decision,
    "ALLOW",
    `Legitimate payment was not allowed: ${JSON.stringify(result)}`
  );
});

for (const attack of redTeamAttacks) {
  test(`RED TEAM blocks: ${attack.id} — ${attack.name}`, () => {
    const scenario = createScenario();
    attack.mutate(scenario);

    const result = evaluateScenario(scenario);

    assert.equal(
      result?.decision,
      "BLOCK",
      `Attack was not blocked. Guard result: ${JSON.stringify(result)}`
    );
  });
}
