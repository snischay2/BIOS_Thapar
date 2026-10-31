import "dotenv/config";

import express from "express";
import { isAddress } from "viem";

import { paymentMiddleware } from "@x402/express";

import {
  x402ResourceServer,
  HTTPFacilitatorClient
} from "@x402/core/server";

import {
  registerExactEvmScheme
} from "@x402/evm/exact/server";

const app = express();

app.use((req, res, next) => {
  console.log(`[MERCHANT REQUEST] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    console.log(`[MERCHANT RESPONSE] ${res.statusCode}`);
  });

  next();
});

app.disable("x-powered-by");

const PORT = Number(process.env.MERCHANT_PORT || 5001);

const NETWORK = "eip155:84532";

const FACILITATOR_URL =
  process.env.FACILITATOR_URL ||
  "https://x402.org/facilitator";

const payTo = process.env.MERCHANT_PAY_TO;

if (!payTo || !isAddress(payTo, { strict: false })) {
  throw new Error(
    "Set a valid MERCHANT_PAY_TO EVM wallet address in .env"
  );
}

// Facilitator handles verification and settlement.
const facilitatorClient = new HTTPFacilitatorClient({
  url: FACILITATOR_URL
});

// Create x402 resource server.
const resourceServer = new x402ResourceServer(
  facilitatorClient
);

// Register Base Sepolia exact EVM payment scheme.
registerExactEvmScheme(resourceServer);

// Protect weather endpoint with x402.
const paymentRoutes = {
  "GET /weather": {
    accepts: [
      {
        scheme: "exact",
        price: "$0.001",
        network: NETWORK,
        payTo
      }
    ],

    description: "TXFORT demo weather API",

    mimeType: "application/json"
  }
};

// Apply official x402 middleware.
app.use(
  paymentMiddleware(
    paymentRoutes,
    resourceServer
  )
);

// This endpoint is accessible only after x402 payment.
app.get("/weather", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "TXFORT Merchant",

    report: {
      city: "Jalandhar",
      weather: "Sunny",
      temperature: 29,
      humidity: 45
    },

    message: "Payment verified. Premium weather data delivered."
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "x402-merchant",
    network: NETWORK,
    message: "Merchant server running"
  });
});

app.listen(PORT, () => {
  console.log("------------------------------------");
  console.log("TXFORT MERCHANT SERVER");
  console.log(`Port: ${PORT}`);
  console.log(`Network: ${NETWORK}`);
  console.log(`Facilitator: ${FACILITATOR_URL}`);
  console.log(`Receiving wallet: ${payTo}`);
  console.log("------------------------------------");
});