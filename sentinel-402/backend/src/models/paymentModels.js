import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const { Schema } = mongoose;

const zeroDecimal = () =>
  mongoose.Types.Decimal128.fromString("0");

// ============================================
// SPENDING COUNTER MODEL
// ============================================

const spendCounterSchema = new Schema(
  {
    agentId: {
      type: String,
      required: true,
      trim: true
    },

    dayKey: {
      type: String,
      required: true
    },

    reservedAtomic: {
      type: Schema.Types.Decimal128,
      required: true,
      default: zeroDecimal
    },

    settledAtomic: {
      type: Schema.Types.Decimal128,
      required: true,
      default: zeroDecimal
    },

    dailyLimitAtomic: {
      type: Schema.Types.Decimal128,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// One counter per agent per UTC day.
spendCounterSchema.index(
  {
    agentId: 1,
    dayKey: 1
  },
  {
    unique: true
  }
);

// ============================================
// PAYMENT RESERVATION MODEL
// ============================================

const paymentReservationSchema = new Schema(
  {
    reservationId: {
      type: String,
      default: randomUUID,
      unique: true,
      required: true
    },

    agentId: {
      type: String,
      required: true,
      index: true
    },

    idempotencyKey: {
      type: String,
      required: true
    },

    paymentFingerprint: {
      type: String,
      required: true
    },

    dayKey: {
      type: String,
      required: true
    },

    amountAtomic: {
      type: String,
      required: true
    },

    amountDecimal: {
      type: Schema.Types.Decimal128,
      required: true
    },

    merchantId: {
      type: String,
      required: true
    },

    resourceUrl: {
      type: String,
      required: true
    },

    network: {
      type: String,
      required: true
    },

    asset: {
      type: String,
      required: true
    },

    payTo: {
      type: String,
      required: true
    },

    state: {
      type: String,
      enum: [
        "PENDING",
        "SETTLED",
        "RELEASED"
      ],
      default: "PENDING",
      required: true
    },

    expiresAt: {
      type: Date,
      required: true
    },

    settlementTxHash: {
      type: String,
      default: null
    },

    releaseReason: {
      type: String,
      default: null
    },

    settledAt: {
      type: Date,
      default: null
    },

    releasedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Prevent duplicate reservation keys for one agent.
paymentReservationSchema.index(
  {
    agentId: 1,
    idempotencyKey: 1
  },
  {
    unique: true
  }
);

// Useful for reservation lookups and cleanup.
paymentReservationSchema.index({
  agentId: 1,
  state: 1,
  expiresAt: 1
});

export const SpendCounter =
  mongoose.models.SpendCounter ||
  mongoose.model(
    "SpendCounter",
    spendCounterSchema
  );

export const PaymentReservation =
  mongoose.models.PaymentReservation ||
  mongoose.model(
    "PaymentReservation",
    paymentReservationSchema
  );