
import mongoose from "mongoose";

const attackResultSchema = new mongoose.Schema(
  {
    attackId: { type: String, required: true },
    attackName: { type: String, required: true },

    category: {
      type: String,
      enum: ["CONTROL", "ATTACK"],
      required: true
    },

    expectedDecision: {
      type: String,
      enum: ["ALLOW", "BLOCK"],
      required: true
    },

    actualDecision: {
      type: String,
      enum: ["ALLOW", "BLOCK", "ERROR", "UNKNOWN"],
      required: true
    },

    passed: { type: Boolean, required: true },
    latencyMs: { type: Number, default: 0 },
    reasons: { type: [String], default: [] },
    error: { type: String, default: null }
  },
  { _id: false }
);

const attackRunSchema = new mongoose.Schema(
  {
    runType: {
      type: String,
      default: "LOCAL_RED_BLUE_SIMULATION"
    },

    status: {
      type: String,
      enum: ["PASS", "NEEDS_REVIEW"],
      required: true
    },

    durationMs: { type: Number, default: 0 },

    summary: {
      totalTests: Number,
      attacksTotal: Number,
      attacksBlocked: Number,
      attacksAllowed: Number,
      attackErrors: Number,
      legitimatePaymentAllowed: Boolean,
      legitimatePaymentBlocked: Boolean,
      detectionRate: Number,
      falsePositiveRate: Number,
      errorRate: Number,
      averageLatencyMs: Number,
      securityScore: Number
    },

    results: {
      type: [attackResultSchema],
      default: []
    }
  },
  { timestamps: true }
);

attackRunSchema.index({ createdAt: -1 });

const AttackRun =
  mongoose.models.AttackRun ||
  mongoose.model("AttackRun", attackRunSchema);

export default AttackRun;
