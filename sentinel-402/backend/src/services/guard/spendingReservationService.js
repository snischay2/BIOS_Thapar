import mongoose from "mongoose";
import { createHash } from "node:crypto";

import {
  SpendCounter,
  PaymentReservation
} from "../../models/paymentModels.js";

// ============================================
// HELPERS
// ============================================

function validateAtomic(value, fieldName) {
  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value) ||
    value.length > 30 ||
    BigInt(value) <= 0n
  ) {
    throw new Error(
      `${fieldName} must be a positive integer of at most 30 digits`
    );
  }

  return mongoose.Types.Decimal128.fromString(value);
}

function getUTCDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function fingerprintPayment(payment) {
  const stableData = [
    payment.amountAtomic,
    payment.merchantId,
    payment.resourceUrl,
    payment.network,
    payment.asset.toLowerCase(),
    payment.payTo.toLowerCase()
  ].join("|");

  return createHash("sha256")
    .update(stableData)
    .digest("hex");
}

function serializeReservation(reservation) {
  return {
    reservationId: reservation.reservationId,
    agentId: reservation.agentId,
    amountAtomic: reservation.amountAtomic,
    merchantId: reservation.merchantId,
    network: reservation.network,
    asset: reservation.asset,
    payTo: reservation.payTo,
    state: reservation.state,
    expiresAt: reservation.expiresAt,
    settlementTxHash: reservation.settlementTxHash
  };
}

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// ============================================
// RESERVE SPENDING BUDGET
// ============================================

export async function reserveSpend({
  agentId,
  idempotencyKey,
  amountAtomic,
  dailyLimitAtomic,
  merchantId,
  resourceUrl,
  network,
  asset,
  payTo
}) {
  if (
    !agentId ||
    !idempotencyKey ||
    idempotencyKey.length > 128
  ) {
    throw createError(
      "INVALID_RESERVATION_INPUT",
      "Agent ID and valid idempotency key are required"
    );
  }

  const amountDecimal = validateAtomic(
    amountAtomic,
    "amountAtomic"
  );

  const limitDecimal = validateAtomic(
    dailyLimitAtomic,
    "dailyLimitAtomic"
  );

  if (
    typeof resourceUrl !== "string" ||
    typeof merchantId !== "string" ||
    typeof network !== "string" ||
    typeof asset !== "string" ||
    typeof payTo !== "string"
  ) {
    throw createError(
      "INVALID_RESERVATION_INPUT",
      "Payment metadata is incomplete"
    );
  }

  const now = new Date();
  const dayKey = getUTCDateKey(now);

  const expiresAt = new Date(
    now.getTime() + 10 * 60 * 1000
  );

  const payment = {
    amountAtomic,
    merchantId,
    resourceUrl,
    network,
    asset,
    payTo
  };

  const paymentFingerprint =
    fingerprintPayment(payment);

  // Ensure daily counter exists.
  // Duplicate-key race is harmless because the
  // unique index ensures only one document exists.
  try {
    await SpendCounter.updateOne(
      {
        agentId,
        dayKey
      },
      {
        $setOnInsert: {
          agentId,
          dayKey,
          reservedAtomic: mongoose.Types.Decimal128.fromString("0"),
          settledAtomic: mongoose.Types.Decimal128.fromString("0"),
          dailyLimitAtomic: limitDecimal
        }
      },
      {
        upsert: true
      }
    );
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }

  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(
      async () => {
        // Check idempotency first.
        const existing = await PaymentReservation.findOne({
          agentId,
          idempotencyKey
        }).session(session);

        if (existing) {
          if (
            existing.paymentFingerprint !==
            paymentFingerprint
          ) {
            throw createError(
              "IDEMPOTENCY_KEY_REUSED",
              "Idempotency key was reused for different payment details"
            );
          }

          if (existing.state === "PENDING") {
  throw createError(
    "IDEMPOTENCY_KEY_IN_PROGRESS",
    "An existing payment reservation must be reconciled before retrying"
  );
}

          throw createError(
            "RESERVATION_ALREADY_FINALIZED",
            "This payment reservation has already been finalized"
          );
        }

        // Atomic daily spending check and reservation.
        const counterResult = await SpendCounter.updateOne(
          {
            agentId,
            dayKey,

            $expr: {
              $lte: [
                {
                  $add: [
                    "$reservedAtomic",
                    "$settledAtomic",
                    amountDecimal
                  ]
                },
                limitDecimal
              ]
            }
          },
          {
            $inc: {
              reservedAtomic: amountDecimal
            },

            $set: {
              dailyLimitAtomic: limitDecimal,
              updatedAt: now
            }
          },
          {
            session
          }
        );

        if (counterResult.matchedCount !== 1) {
          return {
            approved: false,
            code: "DAILY_LIMIT_EXCEEDED",
            message: "Insufficient available daily spending budget"
          };
        }

        // Insert reservation in the same transaction.
        const [reservation] =
          await PaymentReservation.create(
            [
              {
                agentId,
                idempotencyKey,
                paymentFingerprint,
                dayKey,
                amountAtomic,
                amountDecimal,
                merchantId,
                resourceUrl,
                network,
                asset,
                payTo,
                state: "PENDING",
                expiresAt
              }
            ],
            {
              session
            }
          );

        return {
          approved: true,
          reused: false,
          reservation: serializeReservation(reservation)
        };
      },
      {
        readPreference: "primary",
        readConcern: {
          level: "snapshot"
        },
        writeConcern: {
          w: "majority"
        }
      }
    );

    return result;

  } finally {
    await session.endSession();
  }
}

// ============================================
// SETTLE SUCCESSFUL PAYMENT
// ============================================

export async function settleSpend({
  reservationId,
  agentId,
  txHash
}) {
  if (
    !reservationId ||
    !agentId ||
    !/^0x[a-fA-F0-9]{64}$/.test(txHash ?? "")
  ) {
    throw createError(
      "INVALID_SETTLEMENT",
      "Valid reservation ID, agent ID and transaction hash are required"
    );
  }

  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(
      async () => {
        const reservation = await PaymentReservation.findOne({
          reservationId,
          agentId
        }).session(session);

        if (!reservation) {
          throw createError(
            "RESERVATION_NOT_FOUND",
            "Payment reservation does not exist"
          );
        }

        if (reservation.state === "SETTLED") {
          if (reservation.settlementTxHash === txHash) {
            return {
              success: true,
              reused: true,
              state: "SETTLED"
            };
          }

          throw createError(
            "SETTLEMENT_CONFLICT",
            "Reservation was already settled with another transaction"
          );
        }

        if (reservation.state !== "PENDING") {
          throw createError(
            "INVALID_RESERVATION_STATE",
            "Only pending reservations can be settled"
          );
        }

        if (reservation.expiresAt <= new Date()) {
          throw createError(
            "RESERVATION_EXPIRED",
            "Expired reservation cannot be settled"
          );
        }

        const counterResult = await SpendCounter.updateOne(
          {
            agentId,
            dayKey: reservation.dayKey,
            reservedAtomic: {
              $gte: reservation.amountDecimal
            }
          },
          {
            $inc: {
              reservedAtomic: mongoose.Types.Decimal128.fromString(
                `-${reservation.amountAtomic}`
              ),
              settledAtomic: reservation.amountDecimal
            }
          },
          {
            session
          }
        );

        if (counterResult.matchedCount !== 1) {
          throw createError(
            "COUNTER_INCONSISTENT",
            "Spending counter could not be updated"
          );
        }

        reservation.state = "SETTLED";
        reservation.settlementTxHash = txHash;
        reservation.settledAt = new Date();

        await reservation.save({
          session
        });

        return {
          success: true,
          reused: false,
          state: "SETTLED",
          reservation: serializeReservation(reservation)
        };
      },
      {
        writeConcern: {
          w: "majority"
        }
      }
    );

  } finally {
    await session.endSession();
  }
}

// ============================================
// RELEASE FAILED PAYMENT
// ============================================

export async function releaseSpend({
  reservationId,
  agentId,
  reason = "Payment failed"
}) {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(
      async () => {
        const reservation = await PaymentReservation.findOne({
          reservationId,
          agentId
        }).session(session);

        if (!reservation) {
          throw createError(
            "RESERVATION_NOT_FOUND",
            "Payment reservation does not exist"
          );
        }

        if (reservation.state === "RELEASED") {
          return {
            success: true,
            reused: true,
            state: "RELEASED"
          };
        }

        if (reservation.state !== "PENDING") {
          throw createError(
            "INVALID_RESERVATION_STATE",
            "Only pending reservations can be released"
          );
        }

        const counterResult = await SpendCounter.updateOne(
          {
            agentId,
            dayKey: reservation.dayKey,
            reservedAtomic: {
              $gte: reservation.amountDecimal
            }
          },
          {
            $inc: {
              reservedAtomic: mongoose.Types.Decimal128.fromString(
                `-${reservation.amountAtomic}`
              )
            }
          },
          {
            session
          }
        );

        if (counterResult.matchedCount !== 1) {
          throw createError(
            "COUNTER_INCONSISTENT",
            "Spending counter could not be updated"
          );
        }

        reservation.state = "RELEASED";
        reservation.releaseReason = reason;
        reservation.releasedAt = new Date();

        await reservation.save({
          session
        });

        return {
          success: true,
          reused: false,
          state: "RELEASED",
          reservation: serializeReservation(reservation)
        };
      },
      {
        writeConcern: {
          w: "majority"
        }
      }
    );

  } finally {
    await session.endSession();
  }
}