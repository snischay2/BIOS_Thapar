import { Router } from "express";

import {
  evaluatePaymentController
} from "../controllers/paymentControllers.js";

const router = Router();

// Evaluate x402 payment requirements
router.post(
  "/evaluate",
  evaluatePaymentController
);

export default router;