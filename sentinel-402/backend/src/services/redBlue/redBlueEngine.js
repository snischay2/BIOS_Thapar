
import { performance } from "node:perf_hooks";

import AttackRun from "../../models/AttackRun.js";
import { evaluatePaymentRequired } from "../guard/paymentGuard.js";
import {
  createScenario,
  redTeamAttacks
} from "../guard/redTeamCases.js";

function normalizeDecision(result) {
  const decision = result?.decision;

  if (decision === "ALLOW" || decision === "BLOCK") {
    return decision;
  }

  return "UNKNOWN";
}

function normalizeReasons(result) {
  const source = result?.reasons ?? result?.errors ?? [];

  if (!Array.isArray(source)) {
    return source ? [String(source)] : [];
  }

  return source.map(reason =>
    typeof reason === "string"
      ? reason
      : JSON.stringify(reason)
  );
}

function evaluateScenario(scenario) {
  return evaluatePaymentRequired({
    paymentRequired: scenario.paymentRequired,
    policy: scenario.policy,
    merchants: scenario.merchants
  });
}

function runSingleTest({
  id,
  name,
  category,
  expected,
  scenario
}) {
  const startedAt = performance.now();

  try {
    const result = evaluateScenario(scenario);
    const actual = normalizeDecision(result);

    return {
      attackId: id,
      attackName: name,
      category,
      expectedDecision: expected,
      actualDecision: actual,
      passed: actual === expected,
      latencyMs: Number(
        (performance.now() - startedAt).toFixed(2)
      ),
      reasons: normalizeReasons(result),
      error: null
    };
  } catch (error) {
    return {
      attackId: id,
      attackName: name,
      category,
      expectedDecision: expected,
      actualDecision: "ERROR",
      passed: false,
      latencyMs: Number(
        (performance.now() - startedAt).toFixed(2)
      ),
      reasons: [],
      error: error.message
    };
  }
}

export async function runRedBlueSimulation() {
  const runStartedAt = performance.now();

  const results = [];

  // BLUE TEAM CONTROL: A legitimate payment must be allowed.
  results.push(
    runSingleTest({
      id: "LEGITIMATE_CONTROL",
      name: "Legitimate payment control",
      category: "CONTROL",
      expected: "ALLOW",
      scenario: createScenario()
    })
  );

  // RED TEAM: Launch each malicious challenge.
  for (const attack of redTeamAttacks) {
    const scenario = createScenario();

    attack.mutate(scenario);

    results.push(
      runSingleTest({
        id: attack.id,
        name: attack.name,
        category: "ATTACK",
        expected: "BLOCK",
        scenario
      })
    );
  }

  const control = results.find(
    result => result.category === "CONTROL"
  );

  const attacks = results.filter(
    result => result.category === "ATTACK"
  );

  const attacksBlocked = attacks.filter(
    result => result.actualDecision === "BLOCK"
  ).length;

  const attacksAllowed = attacks.filter(
    result => result.actualDecision === "ALLOW"
  ).length;

  const attackErrors = attacks.filter(
    result =>
      result.actualDecision === "ERROR" ||
      result.actualDecision === "UNKNOWN"
  ).length;

  const legitimatePaymentAllowed =
    control.actualDecision === "ALLOW";

  const legitimatePaymentBlocked =
    control.actualDecision === "BLOCK";

  const detectionRate = attacks.length
    ? (attacksBlocked / attacks.length) * 100
    : 0;

  const falsePositiveRate =
    legitimatePaymentAllowed ? 0 :
    legitimatePaymentBlocked ? 100 : null;

  const totalLatency = results.reduce(
    (sum, item) => sum + item.latencyMs,
    0
  );

  const averageLatencyMs =
    totalLatency / Math.max(results.length, 1);

  // Demo scoring: 70% attack detection + 30% legitimate-payment acceptance.
  const securityScore = Math.round(
    70 * (attacksBlocked / Math.max(attacks.length, 1)) +
    30 * (legitimatePaymentAllowed ? 1 : 0)
  );

  const errorCount = results.filter(
    result => result.actualDecision === "ERROR" ||
              result.actualDecision === "UNKNOWN"
  ).length;

  const summary = {
    totalTests: results.length,
    attacksTotal: attacks.length,
    attacksBlocked,
    attacksAllowed,
    attackErrors,
    legitimatePaymentAllowed,
    legitimatePaymentBlocked,
    detectionRate: Number(detectionRate.toFixed(2)),
    falsePositiveRate,
    errorRate: Number(
      ((errorCount / results.length) * 100).toFixed(2)
    ),
    averageLatencyMs: Number(averageLatencyMs.toFixed(2)),
    securityScore
  };

  const status =
    results.every(result => result.passed)
      ? "PASS"
      : "NEEDS_REVIEW";

  const durationMs = Number(
    (performance.now() - runStartedAt).toFixed(2)
  );

  // Persist complete run and individual attack results.
  const savedRun = await AttackRun.create({
    runType: "LOCAL_RED_BLUE_SIMULATION",
    status,
    durationMs,
    summary,
    results
  });

  return {
    runId: savedRun._id.toString(),
    status,
    durationMs,
    summary,
    results,
    createdAt: savedRun.createdAt
  };
}
