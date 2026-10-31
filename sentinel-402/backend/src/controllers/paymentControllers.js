import { randomUUID } from "node:crypto";

import {
  evaluatePaymentRequired
} from "../services/guard/paymentGuard.js";

import {
  demoPolicy,
  demoMerchants
} from "../services/guard/demoPolicy.js";

export async function evaluatePaymentController(req, res, next) {
  const requestId = randomUUID();

  try {
    const { paymentRequired } = req.body ?? {};

    // Validate incoming request
    if (
      !paymentRequired ||
      typeof paymentRequired !== "object" ||
      Array.isArray(paymentRequired)
    ) {
      return res.status(400).json({
        success: false,
        requestId,
        message: "A valid PaymentRequired object is required"
      });
    }

    // Evaluate the challenge using our security engine
    const result = evaluatePaymentRequired({
      paymentRequired,
      policy: demoPolicy,
      merchants: demoMerchants
    });

    // Return security decision
    return res.status(200).json({
      success: true,
      requestId,
      evaluatedAt: new Date().toISOString(),
      service: "SENTINEL-402",
      merchantId: result.merchantId ?? null,
      decision: result.decision,
      approved: result.approved,
      selectedRequirement: result.selectedRequirement,
      reasons: result.reasons
    });

  } catch (error) {
    console.error("Payment evaluation error:", {
      requestId,
      message: error.message
    });

    return res.status(500).json({
      success: false,
      requestId,
      decision: "BLOCK",
      approved: false,
      message: "Payment evaluation failed"
    });
  }
}