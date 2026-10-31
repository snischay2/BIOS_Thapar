import mongoose from "mongoose";

const EvaluatorResultSchema = new mongoose.Schema(
  {
    attackId: { type: String, default: "" },
    attackName: { type: String, default: "" },
    category: { type: String, default: "ATTACK" },
    expectedDecision: { type: String, default: "" },
    actualDecision: { type: String, default: "UNKNOWN" },
    passed: { type: Boolean, default: false },
    latencyMs: { type: Number, default: 0 },
    reasons: { type: [mongoose.Schema.Types.Mixed], default: [] },
    error: { type: String, default: null }
  },
  { _id: false }
);

const EvaluatorRunSchema = new mongoose.Schema(
  {
    direction: {
      type: String,
      enum: ["OUTBOUND", "INBOUND"],
      required: true,
      index: true
    },
    teamName: { type: String, required: true, maxlength: 80 },
    endpointUrl: { type: String, default: "" },
    evaluationId: { type: String, default: "", index: true },
    caseId: { type: String, default: "" },
    protocol: { type: String, default: "X402_RED_BLUE_V1" },
    status: {
      type: String,
      enum: ["PASS", "NEEDS_REVIEW", "ERROR", "RECEIVED"],
      default: "RECEIVED"
    },
    sourceIp: { type: String, default: "" },
    summary: { type: mongoose.Schema.Types.Mixed, default: {} },
    results: { type: [EvaluatorResultSchema], default: [] }
  },
  { timestamps: true }
);

EvaluatorRunSchema.index({ direction: 1, createdAt: -1 });

export default mongoose.models.EvaluatorRun ||
  mongoose.model("EvaluatorRun", EvaluatorRunSchema);
