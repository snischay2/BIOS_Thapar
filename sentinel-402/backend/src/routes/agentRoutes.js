import { Router } from "express";

import {
  runWeatherAgentController
} from "../controllers/agentController.js";

const router = Router();

// Agent requests paid weather data.
// The wallet is controlled by the guarded x402 client.
router.post(
  "/weather",
  runWeatherAgentController
);

export default router;