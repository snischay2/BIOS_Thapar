
import "dotenv/config";

import { randomUUID } from "node:crypto";

import { x402Client } from "@x402/core/client";

import {
  wrapFetchWithPayment,
  x402HTTPClient
} from "@x402/fetch";

import {
  registerExactEvmScheme
} from "@x402/evm/exact/client";

import {
  privateKeyToAccount
} from "viem/accounts";

import {
  evaluatePaymentRequired
} from "../guard/paymentGuard.js";

import {
  demoPolicy,
  demoMerchants
} from "../guard/demoPolicy.js";

import {
  reserveSpend,
  settleSpend,
  releaseSpend
} from "../guard/spendingReservationService.js";

const NETWORK = "eip155:84532";

const AGENT_ID =
  process.env.AGENT_ID || demoPolicy.agentId;

const MERCHANT_ORIGIN =
  process.env.MERCHANT_ORIGIN;

function validateEnvironment() {
  const privateKey = process.env.EVM_PRIVATE_KEY;

  if (
    !privateKey ||
    !/^0x[0-9a-fA-F]{64}$/.test(privateKey)
  ) {
    throw new Error(
      "A valid dedicated EVM_PRIVATE_KEY is required"
    );
  }

  if (!MERCHANT_ORIGIN) {
    throw new Error(
      "MERCHANT_ORIGIN is missing"
    );
  }

  return privateKey;
}

async function readResponseBody(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function requestPaidWeather({
  idempotencyKey = randomUUID()
} = {}) {
  const privateKey = validateEnvironment();

  const account = privateKeyToAccount(privateKey);

  const client = new x402Client();

  registerExactEvmScheme(client, {
    signer: account,
    networks: [NETWORK]
  });

  const httpClient = new x402HTTPClient(client);

  let reservationId = null;
  let reservationReleased = false;

  // ==========================================
  // BLUE TEAM: PRE-SIGNING SECURITY GATE
  // ==========================================

  client.onBeforePaymentCreation(
    async context => {
      try {
        const paymentRequired =
          context?.paymentRequired;

        const selectedRequirements =
          context?.selectedRequirements;

        if (
          !paymentRequired ||
          !selectedRequirements
        ) {
          return {
            abort: true,
            reason: "Missing x402 payment context"
          };
        }

        // Evaluate the exact selected payment option.
        const guardedChallenge = {
          ...paymentRequired,
          accepts: [selectedRequirements]
        };

        const decision = evaluatePaymentRequired({
          paymentRequired: guardedChallenge,
          policy: demoPolicy,
          merchants: demoMerchants
        });

        if (!decision.approved) {
          console.warn(
            "SENTINEL BLOCKED PAYMENT:",
            decision.reasons
          );

          return {
            abort: true,
            reason: decision.reasons
              .map(reason => reason.code)
              .join(", ")
          };
        }

        // ======================================
        // MONGODB ATOMIC SPENDING RESERVATION
        // ======================================

        const reservation = await reserveSpend({
          agentId: AGENT_ID,
          idempotencyKey,

          amountAtomic:
            selectedRequirements.amount,

          dailyLimitAtomic:
            demoPolicy.dailyLimitAtomic,

          merchantId: decision.merchantId,

          resourceUrl:
            paymentRequired.resource.url,

          network:
            selectedRequirements.network,

          asset:
            selectedRequirements.asset,

          payTo:
            selectedRequirements.payTo
        });

        if (!reservation.approved) {
          return {
            abort: true,
            reason:
              reservation.message ||
              "Daily spending budget exceeded"
          };
        }

        reservationId =
          reservation.reservation.reservationId;

        console.log(
          "SENTINEL APPROVED:",
          reservationId
        );

        return;

      } catch (error) {
        console.error(
          "Pre-signing guard failed:",
          error.message
        );

        return {
          abort: true,
          reason: "Security guard or reservation failed"
        };
      }
    }
  );

  // ==========================================
  // RELEASE IF SIGNING ITSELF FAILS
  // ==========================================

  client.onPaymentCreationFailure(
    async ({ error }) => {
      if (!reservationId || reservationReleased) {
        return;
      }

      try {
        await releaseSpend({
          reservationId,
          agentId: AGENT_ID,
          reason: "Wallet payment creation failed"
        });

        reservationReleased = true;

      } catch (releaseError) {
        console.error(
          "Reservation release failed:",
          releaseError.message
        );
      }

      console.error(
        "Payment creation failed:",
        error?.message
      );
    }
  );

  // ==========================================
  // PAYMENT-AWARE FETCH CLIENT
  // ==========================================

  const paidFetch = wrapFetchWithPayment(
    fetch,
    httpClient
  );

  const weatherUrl = new URL(
    "/weather",
    MERCHANT_ORIGIN
  ).toString();

  let response;

  try {
    response = await paidFetch(weatherUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

  } catch (error) {
    /*
      A network error after signing is ambiguous.
      Keep reservation pending for reconciliation.
    */

    error.reservationId = reservationId;

    console.error(
      "Paid request failed:",
      error.message
    );

    throw error;
  }

  // ==========================================
  // PROCESS SETTLEMENT RESPONSE
  // ==========================================

  const paymentResponseHeader =
    response.headers.get("PAYMENT-RESPONSE");

  console.log("\n========== X402 DEBUG ==========");
  console.log("Final HTTP status:", response.status);
  console.log("Response OK:", response.ok);

  console.log(
    "PAYMENT-RESPONSE present:",
    Boolean(paymentResponseHeader)
  );

  let settlement = null;

  if (paymentResponseHeader) {
    try {
      settlement =
        httpClient.getPaymentSettleResponse(
          name => response.headers.get(name)
        );

    } catch (error) {
      console.error(
        "Could not parse PAYMENT-RESPONSE:",
        error.message
      );

      console.log("================================\n");

      return {
        success: false,
        paymentStatus: "PENDING_RECONCILIATION",
        responseStatus: response.status,
        reservationId,
        error: error.message,
        message:
          "PAYMENT-RESPONSE received but could not be parsed. Reservation remains pending. Do not retry."
      };
    }
  }

  // ==========================================
  // SETTLEMENT DIAGNOSTICS
  // ==========================================

  console.log("[SENTINEL X402 SETTLEMENT]", {
    httpStatus: response.status,
    responseOk: response.ok,
    paymentResponsePresent: Boolean(paymentResponseHeader),
    success: settlement?.success,
    errorReason: settlement?.errorReason,
    transaction: settlement?.transaction,
    network: settlement?.network,
    payer: settlement?.payer
  });

  console.log(
    "Final response body:",
    await response.clone().text()
  );

  console.log("================================\n");

  // ==========================================
  // NO SETTLEMENT RESPONSE
  // ==========================================

  if (!settlement) {
    return {
      success: false,
      paymentStatus: "UNCONFIRMED",
      responseStatus: response.status,
      reservationId,
      message:
        "No PAYMENT-RESPONSE received. Reservation remains pending. Reconcile before retrying."
    };
  }

  // ==========================================
  // FACILITATOR REJECTION
  // ==========================================

  if (settlement.success === false) {
    const errorReason =
      settlement.errorReason ||
      "unknown_settlement_error";

    // Pending is not a definitive rejection.
    if (errorReason === "settlement_pending") {
      return {
        success: false,
        paymentStatus: "PENDING_RECONCILIATION",
        responseStatus: response.status,
        reservationId,
        transactionHash:
          settlement.transaction || null,
        network: settlement.network || null,
        payer: settlement.payer || null,
        errorReason,
        settlement,
        message:
          "Settlement is pending. Budget remains reserved. Do not retry."
      };
    }

    /*
      Definitive rejection: release the reservation.
      If release fails, require reconciliation.
    */

    if (reservationId && !reservationReleased) {
      try {
        await releaseSpend({
          reservationId,
          agentId: AGENT_ID,
          reason: errorReason
        });

        reservationReleased = true;

      } catch (releaseError) {
        console.error(
          "Reservation release failed:",
          releaseError.message
        );

        return {
          success: false,
          paymentStatus: "PENDING_RECONCILIATION",
          responseStatus: response.status,
          reservationId,
          errorReason,
          settlement,
          releaseError: releaseError.message,
          message:
            "Facilitator rejected settlement but reservation release failed. Reconcile before retrying."
        };
      }
    }

    console.error(
      "[SENTINEL PAYMENT REJECTED]",
      errorReason
    );

    return {
      success: false,
      paymentStatus: "FAILED",
      responseStatus: response.status,
      reservationId,
      transactionHash:
        settlement.transaction || null,
      network: settlement.network || null,
      payer: settlement.payer || null,
      errorReason,
      settlement,
      message:
        `Facilitator settlement failed: ${errorReason}`
    };
  }

  // Unknown response is not proof of settlement.
  if (settlement.success !== true) {
    return {
      success: false,
      paymentStatus: "PENDING_RECONCILIATION",
      responseStatus: response.status,
      reservationId,
      settlement,
      message:
        "Facilitator did not confirm success. Budget remains reserved pending reconciliation."
    };
  }

  // ==========================================
  // VERIFY SUCCESS RECEIPT BEFORE ACCOUNTING
  // ==========================================

  if (!reservationId) {
    throw new Error(
      "Settlement arrived without a SENTINEL reservation"
    );
  }

  const validTxHash =
    /^0x[a-fA-F0-9]{64}$/.test(
      settlement.transaction || ""
    );

  const validPayer =
    typeof settlement.payer === "string" &&
    settlement.payer.toLowerCase() ===
      account.address.toLowerCase();

  const validNetwork =
    settlement.network === NETWORK;

  if (
    !validTxHash ||
    !validPayer ||
    !validNetwork
  ) {
    return {
      success: false,
      paymentStatus: "PENDING_RECONCILIATION",
      responseStatus: response.status,
      reservationId,
      settlement,
      message:
        "Settlement receipt failed SENTINEL verification. Budget remains reserved pending reconciliation."
    };
  }

  // ==========================================
  // FINALIZE MONGODB SPENDING COUNTER
  // ==========================================

  const accounting = await settleSpend({
    reservationId,
    agentId: AGENT_ID,
    txHash: settlement.transaction
  });

  const data = await readResponseBody(response);

  return {
    success: response.ok,
    paymentStatus: accounting.state,
    responseStatus: response.status,
    reservationId,
    transactionHash: settlement.transaction,
    network: settlement.network,
    payer: settlement.payer,
    settlement,
    data,
    message: response.ok
      ? "x402 payment settled and merchant resource delivered."
      : "x402 payment settled, but merchant resource response was not successful."
  };
}
