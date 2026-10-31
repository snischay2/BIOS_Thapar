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

function readResponseBody(response) {
  return response.text().then(text => {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  });
}

export async function requestPaidWeather({
  idempotencyKey = randomUUID()
} = {}) {
  const privateKey = validateEnvironment();

  const account = privateKeyToAccount(privateKey);

  // Each request gets its own client and reservation context.
  const client = new x402Client();

  // Register only Base Sepolia exact EVM payments.
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

        /*
          Evaluate the exact option selected by
          the x402 client, not a different option
          from the accepts array.
        */

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

          amountAtomic: selectedRequirements.amount,

          dailyLimitAtomic:
            demoPolicy.dailyLimitAtomic,

          merchantId: decision.merchantId,

          resourceUrl:
            paymentRequired.resource.url,

          network: selectedRequirements.network,

          asset: selectedRequirements.asset,

          payTo: selectedRequirements.payTo
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

        // Returning normally permits x402 signing.
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
    /*
      First request gets HTTP 402.
      x402 SDK processes the challenge.
      Our hook runs before signing.
      Approved payment is signed.
      SDK retries with PAYMENT-SIGNATURE.
    */

    response = await paidFetch(weatherUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    console.log("\n========== X402 DEBUG ==========");
console.log("Final HTTP status:", response.status);
console.log("Response OK:", response.ok);
console.log(
  "PAYMENT-RESPONSE present:",
  response.headers.has("PAYMENT-RESPONSE")
);

console.log(
  "Final response body:",
  await response.clone().text()
);
console.log("================================\n");

  } catch (error) {
    /*
      A network error after signing is ambiguous.
      Keep any reservation pending until settlement
      can be reconciled.
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

const settlement = paymentResponseHeader
  ? httpClient.getPaymentSettleResponse(
      name => response.headers.get(name)
    )
  : null;

  if (!settlement) {
    return {
      success: false,
      paymentStatus: "UNCONFIRMED",
      reservationId,
      message:
        "No PAYMENT-RESPONSE received. Reservation remains pending."
    };
  }

  if (settlement.success === false) {
    if (
      settlement.errorReason === "settlement_pending"
    ) {
      return {
        success: false,
        paymentStatus: "PENDING_RECONCILIATION",
        reservationId,
        settlement,
        message:
          "Settlement is pending. Spending remains reserved."
      };
    }

    // A definitive failure permits release.
    if (reservationId) {
      await releaseSpend({
        reservationId,
        agentId: AGENT_ID,
        reason:
          settlement.errorReason ||
          "Facilitator rejected payment"
      });

      reservationReleased = true;
    }

    return {
      success: false,
      paymentStatus: "FAILED",
      reservationId,
      settlement
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
      reservationId,
      settlement,
      message:
        "Settlement receipt failed SENTINEL verification. Budget remains reserved."
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
    reservationId,
    transactionHash: settlement.transaction,
    network: settlement.network,
    payer: settlement.payer,
    data
  };
}