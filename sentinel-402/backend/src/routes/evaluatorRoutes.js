import express from "express";
import rateLimit from "express-rate-limit";

import EvaluatorRun from "../models/EvaluatorRun.js";
import {
  EVALUATOR_PROTOCOL,
  assessIncomingChallenge,
  getSentinelFixture,
  getSentinelSuiteFixtures,
  getEvaluatorSuiteCounts,
  runExternalEvaluation
} from "../services/evaluator/evaluatorEngine.js";

const router = express.Router();

const outboundLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Evaluation limit reached. Please retry after the rate-limit window."
  }
});

const inboundLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "SENTINEL public evaluator rate limit exceeded."
  }
});

function getPublicApiBase(req) {
  const configured = process.env.PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto === "https" ? "https" : req.protocol;
  return `${protocol}://${req.get("host")}`.replace(/\/+$/, "");
}

// GET /api/evaluator/info — frontend uses this to display our shareable URL.
router.get("/info", (req, res) => {
  const base = getPublicApiBase(req);
  const publicEndpoint = `${base}/api/evaluator/v1/assess`;
  const fixtureUrl = `${base}/api/evaluator/v1/fixture`;
  const suiteUrl = `${base}/api/evaluator/v1/suite`;
  const suite = getEvaluatorSuiteCounts();

  return res.json({
    success: true,
    service: "SENTINEL-402",
    protocol: EVALUATOR_PROTOCOL,
    suite: { id: EVALUATOR_PROTOCOL, ...suite },
    publicEndpoint,
    fixtureUrl,
    suiteUrl,
    healthUrl: `${base}/api/evaluator/v1/health`,
    publicBaseUrlConfigured: Boolean(process.env.PUBLIC_API_BASE_URL)
  });
});

// GET /api/evaluator/v1/health — remote teams can discover protocol support.
router.get("/v1/health", (req, res) => {
  return res.json({
    success: true,
    guard: "SENTINEL-402",
    protocol: EVALUATOR_PROTOCOL,
    endpoint: "/api/evaluator/v1/assess",
    decisionValues: ["ALLOW", "BLOCK"]
  });
});

// GET /api/evaluator/v1/fixture — safe test challenge; contains no private key.
router.get("/v1/fixture", inboundLimiter, (req, res) => {
  return res.json({
    success: true,
    guard: "SENTINEL-402",
    ...getSentinelFixture(),
    note: "Reference challenge only. It cannot trigger or authorize a payment."
  });
});

// GET /api/evaluator/v1/suite — public challenge inputs for teams testing SENTINEL.
// Expected decisions and scenario labels are intentionally not exposed.
router.get("/v1/suite", inboundLimiter, (req, res) => {
  const cases = getSentinelSuiteFixtures();
  return res.json({
    success: true,
    guard: "SENTINEL-402",
    protocol: EVALUATOR_PROTOCOL,
    count: cases.length,
    cases,
    assessEndpoint: `${getPublicApiBase(req)}/api/evaluator/v1/assess`,
    note: "Submit each paymentRequired object to assessEndpoint. No payment is signed or executed."
  });
});

// POST /api/evaluator/v1/assess — public inbound evaluation API.
// Request: { protocol, evaluationId, teamName, caseId, caseName, paymentRequired }
router.post("/v1/assess", inboundLimiter, async (req, res) => {
  try {
    const {
      protocol,
      evaluationId,
      teamName,
      caseId,
      caseName,
      paymentRequired
    } = req.body || {};

    if (protocol !== EVALUATOR_PROTOCOL) {
      return res.status(400).json({
        success: false,
        protocol: EVALUATOR_PROTOCOL,
        message: `Unsupported protocol. Expected ${EVALUATOR_PROTOCOL}.`
      });
    }

    if (!paymentRequired || typeof paymentRequired !== "object" || Array.isArray(paymentRequired)) {
      return res.status(400).json({
        success: false,
        message: "paymentRequired must be an x402 V2 challenge object."
      });
    }

    if (JSON.stringify(paymentRequired).length > 180 * 1024) {
      return res.status(413).json({
        success: false,
        message: "Payment challenge is too large."
      });
    }

    const assessment = await assessIncomingChallenge({
      paymentRequired,
      teamName,
      evaluationId,
      caseId,
      caseName,
      sourceIp: req.ip
    });

    return res.status(200).json({
      success: true,
      ...assessment
    });
  } catch (error) {
    console.error("[INBOUND EVALUATOR]", error);
    return res.status(500).json({
      success: false,
      message: "SENTINEL could not assess this challenge."
    });
  }
});

// POST /api/evaluator/run — SENTINEL tests another team's compatible guard.
router.post("/run", outboundLimiter, async (req, res) => {
  try {
    const teamName = typeof req.body?.teamName === "string"
      ? req.body.teamName.trim()
      : "";
    const endpointUrl = typeof req.body?.endpointUrl === "string"
      ? req.body.endpointUrl.trim()
      : "";
    const suiteId = req.body?.suiteId || EVALUATOR_PROTOCOL;

    if (!teamName || teamName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Team name is required and must be 80 characters or fewer."
      });
    }

    if (suiteId !== EVALUATOR_PROTOCOL) {
      return res.status(400).json({
        success: false,
        message: `Unsupported suite. Use ${EVALUATOR_PROTOCOL}.`
      });
    }

    if (!endpointUrl) {
      return res.status(400).json({
        success: false,
        message: "A remote guard evaluation endpoint is required."
      });
    }

    const report = await runExternalEvaluation({ teamName, endpointUrl });
    return res.status(201).json({
      success: true,
      message: "External guard evaluation completed.",
      report
    });
  } catch (error) {
    console.error("[OUTBOUND EVALUATOR]", error);
    const message = error.message || "External evaluation failed.";
    const status = /endpoint|URL|HTTPS|private|resolve|credential|network/i.test(message)
      ? 400
      : 502;

    return res.status(status).json({
      success: false,
      message
    });
  }
});

// GET /api/evaluator/incoming?limit=10 — recent teams/cases that tested SENTINEL.
router.get("/incoming", async (req, res) => {
  try {
    const requested = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(requested, 1), 50)
      : 10;

    const requests = await EvaluatorRun.find({ direction: "INBOUND" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("teamName evaluationId caseId results createdAt")
      .lean();

    return res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    console.error("[INCOMING EVALUATOR HISTORY]", error);
    return res.status(500).json({
      success: false,
      message: "Could not load incoming evaluation history."
    });
  }
});

// GET /api/evaluator/history?limit=10 — previous outbound evaluations.
router.get("/history", async (req, res) => {
  try {
    const requested = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(requested, 1), 50)
      : 10;

    const runs = await EvaluatorRun.find({ direction: "OUTBOUND" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("teamName endpointUrl status summary createdAt")
      .lean();

    return res.json({ success: true, count: runs.length, runs });
  } catch (error) {
    console.error("[OUTBOUND EVALUATOR HISTORY]", error);
    return res.status(500).json({
      success: false,
      message: "Could not load evaluator history."
    });
  }
});

export default router;
