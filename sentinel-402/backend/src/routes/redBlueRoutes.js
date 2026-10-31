
import express from "express";
import mongoose from "mongoose";

import AttackRun from "../models/AttackRun.js";
import {
  runRedBlueSimulation
} from "../services/redBlue/redBlueEngine.js";

const router = express.Router();

// POST /api/red-blue/run
// Launch the local Red Team vs Blue Team simulation.
router.post("/run", async (req, res) => {
  try {
    const report = await runRedBlueSimulation();

    return res.status(201).json({
      success: true,
      message: "Red/Blue simulation completed",
      report
    });
  } catch (error) {
    console.error("[RED BLUE ENGINE]", error);

    return res.status(500).json({
      success: false,
      message: "Simulation failed",
      error: error.message
    });
  }
});

// GET /api/red-blue/runs/latest
router.get("/runs/latest", async (req, res) => {
  try {
    const latest = await AttackRun.findOne()
      .sort({ createdAt: -1 })
      .lean();

    if (!latest) {
      return res.status(404).json({
        success: false,
        message: "No simulation runs found. Run the simulator first."
      });
    }

    return res.json({
      success: true,
      report: latest
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch latest run",
      error: error.message
    });
  }
});

// GET /api/red-blue/runs?limit=10
router.get("/runs", async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 10;

    const runs = await AttackRun.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("status durationMs summary createdAt")
      .lean();

    return res.json({
      success: true,
      count: runs.length,
      runs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch simulation history",
      error: error.message
    });
  }
});

// GET /api/red-blue/runs/:id
router.get("/runs/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid run ID"
      });
    }

    const run = await AttackRun.findById(req.params.id).lean();

    if (!run) {
      return res.status(404).json({
        success: false,
        message: "Simulation run not found"
      });
    }

    return res.json({
      success: true,
      report: run
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch simulation run",
      error: error.message
    });
  }
});

export default router;
