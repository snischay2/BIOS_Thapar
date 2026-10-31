import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";

import EvaluatorRun from "../../models/EvaluatorRun.js";
import { evaluatePaymentRequired } from "../guard/paymentGuard.js";
import {
  createScenario,
  redTeamAttacks
} from "../guard/redTeamCases.js";

export const EVALUATOR_PROTOCOL = "X402_RED_BLUE_V1";
const REQUEST_TIMEOUT_MS = 7000;
const MAX_RESPONSE_CHARS = 64 * 1024;

function normalizeDecision(value) {
  return value === "ALLOW" || value === "BLOCK" ? value : "UNKNOWN";
}

function normalizeReasons(value) {
  if (!Array.isArray(value)) return value ? [String(value)] : [];
  return value.map(item => {
    if (typeof item === "string") return item;
    try {
      return item;
    } catch {
      return String(item);
    }
  });
}

function isPrivateIPv4(address) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some(n => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isPrivateIPv6(address) {
  const value = address.toLowerCase().split("%")[0];
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("fc") || value.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(value) || value.startsWith("ff")) return true;

  const mapped = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);

  // Documentation-only IPv6 range should never be a production target.
  if (value.startsWith("::ffff:")) return true;
  if (value.startsWith("2001:db8:")) return true;
  return false;
}

function isPrivateAddress(address) {
  const version = isIP(address);
  if (version === 4) return isPrivateIPv4(address);
  if (version === 6) return isPrivateIPv6(address);
  return true;
}

function isDevelopmentLoopback(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1" || host === "::1";
}

/**
 * Validate a user-supplied remote evaluator URL before the backend makes
 * server-side requests. HTTPS is required outside local development.
 */
export async function validateRemoteEvaluatorUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.length > 2048) {
    throw new Error("Endpoint URL is missing or too long.");
  }

  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error("Enter a valid evaluator endpoint URL.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Endpoint URLs must not contain credentials, query strings or fragments.");
  }

  const localDevelopment =
    process.env.NODE_ENV !== "production" && isDevelopmentLoopback(url.hostname);

  if (url.protocol !== "https:" && !(url.protocol === "http:" && localDevelopment)) {
    throw new Error("Use an HTTPS endpoint. HTTP is only allowed for localhost during development.");
  }

  if (localDevelopment) return url.toString();

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Local and private network endpoints cannot be evaluated.");
  }

  const ipVersion = isIP(hostname);
  if (ipVersion) {
    if (isPrivateAddress(hostname)) {
      throw new Error("Private or reserved IP addresses cannot be evaluated.");
    }
  } else {
    let addresses;
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new Error("The evaluator hostname could not be resolved.");
    }

    if (!addresses.length || addresses.some(item => isPrivateAddress(item.address))) {
      throw new Error("The evaluator hostname resolves to a private or reserved network address.");
    }
  }

  return url.toString();
}

async function readJsonResponse(response) {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_RESPONSE_CHARS) {
    throw new Error("Remote evaluator response is too large.");
  }

  const raw = await response.text();
  if (raw.length > MAX_RESPONSE_CHARS) {
    throw new Error("Remote evaluator response is too large.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Remote evaluator returned non-JSON data (HTTP ${response.status}).`);
  }
}

async function callRemoteGuard({ endpointUrl, evaluationId, testCase }) {
  const startedAt = performance.now();

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        protocol: EVALUATOR_PROTOCOL,
        evaluationId,
        teamName: "TXFORT",
        caseId: randomUUID(),
        paymentRequired: testCase.scenario.paymentRequired
      })
    });

    const body = await readJsonResponse(response);
    const latencyMs = Number((performance.now() - startedAt).toFixed(2));

    if (!response.ok) {
      return {
        attackId: testCase.id,
        attackName: testCase.name,
        category: testCase.category,
        expectedDecision: testCase.expected,
        actualDecision: "ERROR",
        passed: false,
        latencyMs,
        reasons: normalizeReasons(body?.reasons),
        error: body?.message || `Remote evaluator returned HTTP ${response.status}.`
      };
    }

    const decision = normalizeDecision(body?.decision ?? body?.result?.decision);
    const reasons = normalizeReasons(body?.reasons ?? body?.result?.reasons);

    if (decision === "UNKNOWN") {
      return {
        attackId: testCase.id,
        attackName: testCase.name,
        category: testCase.category,
        expectedDecision: testCase.expected,
        actualDecision: "ERROR",
        passed: false,
        latencyMs,
        reasons,
        error: "Remote endpoint did not return decision ALLOW or BLOCK."
      };
    }

    return {
      attackId: testCase.id,
      attackName: testCase.name,
      category: testCase.category,
      expectedDecision: testCase.expected,
      actualDecision: decision,
      passed: decision === testCase.expected,
      latencyMs,
      reasons,
      error: null
    };
  } catch (error) {
    return {
      attackId: testCase.id,
      attackName: testCase.name,
      category: testCase.category,
      expectedDecision: testCase.expected,
      actualDecision: "ERROR",
      passed: false,
      latencyMs: Number((performance.now() - startedAt).toFixed(2)),
      reasons: [],
      error: error.name === "TimeoutError"
        ? `Remote guard timed out after ${REQUEST_TIMEOUT_MS} ms.`
        : error.message || "Could not reach remote evaluator."
    };
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const output = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= items.length) return;
        output[index] = await mapper(items[index], index);
      }
    }
  );

  await Promise.all(workers);
  return output;
}

function createSuite() {
  const controlScenario = createScenario();
  const cases = [{
    id: "LEGITIMATE_CONTROL",
    name: "Legitimate payment control",
    category: "CONTROL",
    expected: "ALLOW",
    scenario: controlScenario
  }];

  for (const attack of redTeamAttacks) {
    const scenario = createScenario();
    attack.mutate(scenario);
    cases.push({
      id: attack.id,
      name: attack.name,
      category: "ATTACK",
      expected: "BLOCK",
      scenario
    });
  }

  return cases;
}

function buildSummary(results) {
  const control = results.find(item => item.category === "CONTROL");
  const attacks = results.filter(item => item.category === "ATTACK");
  const attacksBlocked = attacks.filter(item => item.actualDecision === "BLOCK").length;
  const attacksAllowed = attacks.filter(item => item.actualDecision === "ALLOW").length;
  const attackErrors = attacks.filter(item => item.actualDecision === "ERROR" || item.actualDecision === "UNKNOWN").length;
  const legitimatePaymentAllowed = control?.actualDecision === "ALLOW";
  const legitimatePaymentBlocked = control?.actualDecision === "BLOCK";
  const errors = results.filter(item => item.actualDecision === "ERROR" || item.actualDecision === "UNKNOWN").length;
  const averageLatencyMs = results.reduce((sum, item) => sum + (item.latencyMs || 0), 0) / Math.max(results.length, 1);

  const detectionRate = attacks.length ? (attacksBlocked / attacks.length) * 100 : 0;
  const falsePositiveRate = legitimatePaymentAllowed ? 0 : legitimatePaymentBlocked ? 100 : null;
  const securityScore = Math.round(
    70 * (attacksBlocked / Math.max(attacks.length, 1)) +
    30 * (legitimatePaymentAllowed ? 1 : 0)
  );

  return {
    totalTests: results.length,
    attacksTotal: attacks.length,
    attacksBlocked,
    attacksAllowed,
    attackErrors,
    legitimatePaymentAllowed,
    legitimatePaymentBlocked,
    detectionRate: Number(detectionRate.toFixed(2)),
    falsePositiveRate,
    errorRate: Number(((errors / Math.max(results.length, 1)) * 100).toFixed(2)),
    averageLatencyMs: Number(averageLatencyMs.toFixed(2)),
    securityScore
  };
}

export async function runExternalEvaluation({ teamName, endpointUrl }) {
  const safeEndpoint = await validateRemoteEvaluatorUrl(endpointUrl);
  const evaluationId = randomUUID();
  const startedAt = performance.now();
  const suite = createSuite();

  const results = await mapWithConcurrency(
    suite,
    4,
    testCase => callRemoteGuard({
      endpointUrl: safeEndpoint,
      evaluationId,
      testCase
    })
  );

  const summary = buildSummary(results);
  const status = results.every(item => item.passed) ? "PASS" : "NEEDS_REVIEW";
  const durationMs = Number((performance.now() - startedAt).toFixed(2));

  const saved = await EvaluatorRun.create({
    direction: "OUTBOUND",
    teamName,
    endpointUrl: safeEndpoint,
    evaluationId,
    protocol: EVALUATOR_PROTOCOL,
    status,
    summary,
    results
  });

  return {
    runId: saved._id.toString(),
    evaluationId,
    direction: "OUTBOUND",
    teamName,
    endpointUrl: safeEndpoint,
    protocol: EVALUATOR_PROTOCOL,
    status,
    durationMs,
    summary,
    results,
    createdAt: saved.createdAt
  };
}

/**
 * Assess one challenge sent by another team's evaluator.
 * Policy and merchant allowlists are taken from TXFORT's trusted fixture;
 * caller-supplied policy data is intentionally ignored.
 */
export async function assessIncomingChallenge({
  paymentRequired,
  teamName,
  evaluationId,
  caseId,
  caseName,
  sourceIp
}) {
  const startedAt = performance.now();
  const baseline = createScenario();
  const result = evaluatePaymentRequired({
    paymentRequired,
    policy: baseline.policy,
    merchants: baseline.merchants
  });
  const latencyMs = Number((performance.now() - startedAt).toFixed(2));
  const decision = normalizeDecision(result?.decision);
  const reasons = normalizeReasons(result?.reasons);

  const safeTeamName = typeof teamName === "string" && teamName.trim()
    ? teamName.trim().slice(0, 80)
    : "External team";
  const safeEvaluationId = typeof evaluationId === "string"
    ? evaluationId.slice(0, 100)
    : "";
  const safeCaseId = typeof caseId === "string" ? caseId.slice(0, 100) : "";
  const safeCaseName = typeof caseName === "string" ? caseName.slice(0, 120) : "Incoming challenge";

  const saved = await EvaluatorRun.create({
    direction: "INBOUND",
    teamName: safeTeamName,
    evaluationId: safeEvaluationId,
    caseId: safeCaseId,
    protocol: EVALUATOR_PROTOCOL,
    status: "RECEIVED",
    sourceIp: typeof sourceIp === "string" ? sourceIp.slice(0, 80) : "",
    summary: { received: 1, decision },
    results: [{
      attackId: safeCaseId,
      attackName: safeCaseName,
      category: "INBOUND",
      expectedDecision: "NOT_PROVIDED",
      actualDecision: decision,
      passed: null,
      latencyMs,
      reasons,
      error: null
    }]
  });

  return {
    protocol: EVALUATOR_PROTOCOL,
    guard: "TXFORT-402",
    evaluationId: safeEvaluationId,
    caseId: safeCaseId,
    decision,
    reasons,
    latencyMs,
    requestId: saved._id.toString(),
    evaluatedAt: saved.createdAt
  };
}

export function getEvaluatorSuiteCounts() {
  return { attackCases: redTeamAttacks.length, controlCases: 1, totalCases: redTeamAttacks.length + 1 };
}

export function getTXFORTFixture() {
  const scenario = createScenario();
  return {
    protocol: EVALUATOR_PROTOCOL,
    paymentRequired: scenario.paymentRequired
  };
}

/** Public attack/control inputs for other teams to submit to TXFORT. */
export function getTXFORTSuiteFixtures() {
  return createSuite().map((testCase, index) => ({
    caseId: `CASE_${String(index + 1).padStart(3, "0")}`,
    paymentRequired: testCase.scenario.paymentRequired
  }));
}

export { buildSummary };
