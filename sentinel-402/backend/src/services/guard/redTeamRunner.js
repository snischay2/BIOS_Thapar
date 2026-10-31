
import { evaluatePaymentRequired } from "./paymentGuard.js";
import { createScenario, redTeamAttacks } from "./redTeamCases.js";

function evaluateScenario(scenario) {
  return evaluatePaymentRequired({
    paymentRequired: scenario.paymentRequired,
    policy: scenario.policy,
    merchants: scenario.merchants
  });
}

function getDecision(result) {
  return result?.decision ?? result?.status ?? "UNKNOWN";
}

const results = [];

// First verify that a legitimate payment is still allowed.
const controlScenario = createScenario();
const controlResult = evaluateScenario(controlScenario);
const controlDecision = getDecision(controlResult);

console.log("\n========== TXFORT RED TEAM ==========\n");
console.log(`Legitimate payment control: ${controlDecision}`);

if (controlDecision !== "ALLOW") {
  console.error("CONTROL FAILED: legitimate payment was blocked.");
  console.error(controlResult);
  process.exitCode = 1;
}

// Run every attack against an independent scenario.
for (const attack of redTeamAttacks) {
  const scenario = createScenario();

  try {
    attack.mutate(scenario);

    const result = evaluateScenario(scenario);
    const decision = getDecision(result);
    const blocked = decision === "BLOCK";

    results.push({
      attack: attack.id,
      result: blocked ? "BLOCKED" : `FAILED (${decision})`
    });

    if (!blocked) {
      process.exitCode = 1;
      console.error(`\n[!] ATTACK NOT BLOCKED: ${attack.name}`);
      console.error("Guard result:", result);
    }
  } catch (error) {
    results.push({
      attack: attack.id,
      result: `ERROR: ${error.message}`
    });
    process.exitCode = 1;
  }
}

console.table(results);

const blockedCount = results.filter(
  item => item.result === "BLOCKED"
).length;

console.log("\n=============== SUMMARY ===============");
console.log(`Attacks blocked: ${blockedCount}/${redTeamAttacks.length}`);
console.log(`Attacks not blocked: ${redTeamAttacks.length - blockedCount}`);
console.log(`Legitimate control: ${controlDecision}`);
console.log("=======================================\n");

if (process.exitCode === 1) {
  console.log("RED TEAM RESULT: REVIEW REQUIRED");
} else {
  console.log("RED TEAM RESULT: ALL TESTED ATTACKS BLOCKED");
}
