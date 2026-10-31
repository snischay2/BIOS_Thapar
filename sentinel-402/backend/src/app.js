import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import paymentRoutes from "./routes/paymentRoutes.js";

import agentRoutes from "./routes/agentRoutes.js";
import redBlueRoutes from "./routes/redBlueRoutes.js";

const app = express();

app.disable("x-powered-by");

// Security headers
app.use(helmet());

// Frontend CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Request body parser
app.use(
  express.json({
    limit: "256kb"
  })
);

// Rate limiter for payment evaluation
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

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "SENTINEL-402",
    message: "Backend is running",
    timestamp: new Date().toISOString()
  });
});

// Payment security routes
app.use(
  "/api/payment",
  paymentLimiter,
  paymentRoutes
);

app.use("/api/red-blue", redBlueRoutes);

// Agent routes
app.use(
  "/api/agent",
  agentRoutes
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

// Global error handler
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