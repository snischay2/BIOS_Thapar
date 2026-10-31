import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import paymentRoutes from "./routes/paymentRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import redBlueRoutes from "./routes/redBlueRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import evaluatorRoutes from "./routes/evaluatorRoutes.js";

const app = express();

app.disable("x-powered-by");
// Configure trust proxy when running behind Render/Railway/another reverse proxy.
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);

app.use(helmet());


// Frontend CORS configuration
const normalizeOrigin = (origin) =>
  origin.trim().replace(/\/+$/, "");

const allowedOrigins = (
  process.env.CLIENT_ORIGINS ||
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5173"
)
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without browser Origin (e.g. server-to-server)
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },

    methods: [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With"
    ],

    credentials: true,
    maxAge: 86400
  })
);


app.use(express.json({ limit: "256kb" }));

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many payment evaluation requests"
  }
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "TXFORT-402",
    message: "Backend is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/payment", paymentLimiter, paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/red-blue", redBlueRoutes);
app.use("/api/evaluator", evaluatorRoutes);
app.use("/api/agent", agentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

app.use((err, req, res, next) => {
  console.error("API error:", err.message);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body"
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

export default app;
