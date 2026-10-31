#!/usr/bin/env node

/**
 * TXFORT — LOCAL GUARD SELF-ATTACK TEST
 *
 * Run from backend folder:
 * node ./scripts/test-TXFORT-local.mjs
 *
 * Optional custom backend URL:
 * node ./scripts/test-TXFORT-local.mjs http://localhost:5000
 *
 * IMPORTANT:
 * This script only sends x402 payment challenges.
 * It does NOT sign, broadcast or execute transactions.
 */

import { randomUUID } from "node:crypto";

import {
  createScenario,
  redTeamAttacks
} from "../src/services/guard/redTeamCases.js";

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const BASE_URL = (
  process.argv[2] ||
  process.env.TXFORT_BASE_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const PROTOCOL = "X402_RED_BLUE_V1";

const ASSESS_URL =
  `${BASE_URL}/api/evaluator/v1/assess`;

const HEALTH_URL =
  `${BASE_URL}/api/evaluator/v1/health`;

const EVALUATION_ID = randomUUID();

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

async function readJson(response) {
  const raw = await response.text();

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      `API returned non-JSON response. HTTP ${response.status}: ${raw.slice(0, 250)}`
    );
  }
}

async function postChallenge({
  caseId,
  caseName,
  paymentRequired
}) {
  const started = performance.now();

  const expected =
    caseId === "LEGITIMATE_CONTROL"
      ? "ALLOW"
      : "BLOCK";

  try {
    const response = await fetch(ASSESS_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },

      signal: AbortSignal.timeout(8000),

      body: JSON.stringify({
        protocol: PROTOCOL,
        evaluationId: EVALUATION_ID,
        teamName: "TXFORT Local Self-Test",
        caseId,
        caseName,
        paymentRequired
      })
    });

    const body = await readJson(response);

    const latencyMs = Number(
      (performance.now() - started).toFixed(2)
    );

    if (!response.ok || body.success !== true) {
      return {
        caseId,
        expected,
        actual: "ERROR",
        passed: false,
        latencyMs,
        reasons:
          body.message || `HTTP ${response.status}`
      };
    }

    const actual = body.decision || "UNKNOWN";

    const reasons = Array.isArray(body.reasons)
      ? body.reasons.map(reason =>
          typeof reason === "string"
            ? reason
            : reason.code || reason.message || JSON.stringify(reason)
        ).join("; ")
      : "";

    return {
      caseId,
      expected,
      actual,
      passed: actual === expected,
      latencyMs,
      reasons
    };

  } catch (error) {
    return {
      caseId,
      expected,
      actual: "ERROR",
      passed: false,

      latencyMs: Number(
        (performance.now() - started).toFixed(2)
      ),

      reasons: error.message
    };
  }
}

// --------------------------------------------------
// MAIN TEST RUNNER
// --------------------------------------------------

async function main() {

  console.log("\n");
  console.log("==========================================");
  console.log(" TXFORT — LOCAL GUARD SELF-ATTACK");
  console.log("==========================================");

  console.log(`Target: ${ASSESS_URL}`);

  console.log(
    "Mode: Challenge evaluation only. No payment execution."
  );

  // ----------------------------------------------
  // STEP 1: CONNECT TO BACKEND
  // ----------------------------------------------

  console.log("\n[1] Checking evaluator health...");

  let healthResponse;

  try {
    healthResponse = await fetch(HEALTH_URL, {
      signal: AbortSignal.timeout(5000)
    });

  } catch (error) {

    console.error(
      "\nCannot connect to backend."
    );

    console.error(
      "Start your backend first."
    );

    console.error(error.message);

    process.exitCode = 1;
    return;
  }

  const health = await readJson(healthResponse);

  if (
    !healthResponse.ok ||
    health.protocol !== PROTOCOL
  ) {

    console.error(
      "\nEvaluator health check failed."
    );

    console.error(health);

    process.exitCode = 1;
    return;
  }

  console.log(
    `Connected: ${health.guard || "TXFORT"}`
  );

  console.log(
    `Protocol: ${health.protocol}`
  );

  // ----------------------------------------------
  // STEP 2: PREPARE ATTACK SCENARIOS
  // ----------------------------------------------

  console.log("\n[2] Preparing attack scenarios...");

  const tests = [];

  // Legitimate payment control
  const control = createScenario();

  tests.push({
    id: "LEGITIMATE_CONTROL",
    name: "Legitimate payment control",
    paymentRequired: control.paymentRequired,
    portable: true
  });

  // Existing Red Team attacks
  for (const attack of redTeamAttacks) {

    const scenario = createScenario();

    const challengeBefore = JSON.stringify(
      scenario.paymentRequired
    );

    try {

      attack.mutate(scenario);

    } catch (error) {

      tests.push({
        id: attack.id,
        name: attack.name,
        portable: false,

        localError:
          `Scenario mutation failed: ${error.message}`
      });

      continue;
    }

    const challengeAfter = JSON.stringify(
      scenario.paymentRequired
    );

    /*
     * A remote evaluator only receives paymentRequired.
     *
     * If an attack changes only local policy or merchant
     * configuration, it cannot be represented through the
     * challenge-only HTTP protocol.
     *
     * Such cases are skipped instead of being falsely
     * reported as tested.
     */

    const portable =
      challengeBefore !== challengeAfter;

    tests.push({
      id: attack.id,
      name: attack.name,
      paymentRequired: scenario.paymentRequired,
      portable
    });
  }

  const runnable = tests.filter(
    test => test.portable
  );

  const skipped = tests.filter(
    test => !test.portable
  );

  console.log(
    `Total scenarios: ${tests.length}`
  );

  console.log(
    `Portable scenarios: ${runnable.length}`
  );

  console.log(
    `Skipped scenarios: ${skipped.length}`
  );

  // ----------------------------------------------
  // STEP 3: SEND ATTACKS TO TXFORT
  // ----------------------------------------------

  console.log("\n[3] Sending challenges to TXFORT...");
  console.log("Requests are sent sequentially.\n");

  const results = [];

  for (const testCase of runnable) {

    console.log(
      `Testing: ${testCase.id}`
    );

    const result = await postChallenge({
      caseId: testCase.id,
      caseName: testCase.name,
      paymentRequired: testCase.paymentRequired
    });

    results.push({
      name: testCase.name,
      ...result
    });
  }

  // ----------------------------------------------
  // STEP 4: DISPLAY RESULTS
  // ----------------------------------------------

  console.log("\n");
  console.log("==========================================");
  console.log(" ATTACK RESULTS");
  console.log("==========================================");

  console.table(
    results.map(item => ({
      case: item.caseId,
      expected: item.expected,
      actual: item.actual,

      result: item.passed
        ? "PASS"
        : "FAIL",

      latencyMs: item.latencyMs,

      reason: item.reasons
    }))
  );

  // ----------------------------------------------
  // STEP 5: SUMMARY
  // ----------------------------------------------

  const passed = results.filter(
    item => item.passed
  ).length;

  const failed =
    results.length - passed;

  const blocked = results.filter(
    item => item.actual === "BLOCK"
  ).length;

  const allowed = results.filter(
    item => item.actual === "ALLOW"
  ).length;

  const errors = results.filter(
    item =>
      item.actual === "ERROR" ||
      item.actual === "UNKNOWN"
  ).length;

  console.log("\n");
  console.log("==========================================");
  console.log(" FINAL SECURITY REPORT");
  console.log("==========================================");

  console.log(
    `Portable cases tested : ${results.length}`
  );

  console.log(
    `Passed                : ${passed}`
  );

  console.log(
    `Failed                : ${failed}`
  );

  console.log(
    `Blocked               : ${blocked}`
  );

  console.log(
    `Allowed               : ${allowed}`
  );

  console.log(
    `Errors                : ${errors}`
  );

  console.log(
    `Not portable          : ${skipped.length}`
  );

  // ----------------------------------------------
  // STEP 6: SHOW SKIPPED TESTS
  // ----------------------------------------------

  if (skipped.length > 0) {

    console.log("\n");
    console.log("SKIPPED SCENARIOS");

    console.log(
      "These scenarios changed local policy/merchant data, not the transmitted challenge:"
    );

    for (const item of skipped) {

      console.log(
        `- ${item.id}: ${item.localError || item.name}`
      );
    }
  }

  // ----------------------------------------------
  // FINAL NOTES
  // ----------------------------------------------

  console.log("\n");
  console.log("==========================================");

  console.log(
    "LOCAL SELF-ATTACK TEST COMPLETED"
  );

  console.log(
    "This is an API-level guard evaluation."
  );

  console.log(
    "It is NOT a real blockchain exploit or settlement test."
  );

  console.log("==========================================");

  if (
    failed > 0 ||
    skipped.length > 0
  ) {
    process.exitCode = 1;
  }
}

// --------------------------------------------------
// EXECUTION
// --------------------------------------------------

main().catch(error => {

  console.error(
    "\nLocal evaluator test failed:"
  );

  console.error(error);

  process.exitCode = 1;
});