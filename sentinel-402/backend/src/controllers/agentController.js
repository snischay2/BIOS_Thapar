import { randomUUID } from "node:crypto";

import {
  requestPaidWeather
} from "../services/x402/guardedAgent.js";

export async function runWeatherAgentController(req, res) {
  const idempotencyKey =
    req.get("Idempotency-Key") || randomUUID();

  try {
    const result = await requestPaidWeather({
      idempotencyKey
    });

    if (result.paymentStatus === "SETTLED") {
      return res.status(200).json({
        success: true,
        message: "Payment settled successfully",
        ...result
      });
    }

    if (
      result.paymentStatus === "PENDING_RECONCILIATION" ||
      result.paymentStatus === "UNCONFIRMED"
    ) {
      return res.status(202).json({
        success: false,
        message: "Payment needs settlement reconciliation",
        ...result
      });
    }

    return res.status(402).json({
      success: false,
      message: "Payment failed",
      ...result
    });

  } catch (error) {
    console.error("Agent request error:", error.message);

    return res.status(502).json({
      success: false,
      service: "SENTINEL-402",
      message: "Paid agent request failed",
      reservationId: error.reservationId || null,
      error: error.message
    });
  }
}