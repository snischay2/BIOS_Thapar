
import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";

export default function useSecurityData() {
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");

    const [latest, runs] = await Promise.allSettled([
      api.get("/red-blue/runs/latest"),
      api.get("/red-blue/runs?limit=10"),
    ]);

    if (latest.status === "fulfilled") {
      setReport(latest.value.data.report || null);
    } else {
      const message = latest.reason?.response?.data?.message || "";
      if (!message.toLowerCase().includes("no simulation")) {
        setError(message || "Could not load latest simulation.");
      }
      setReport(null);
    }

    if (runs.status === "fulfilled") {
      setHistory(runs.value.data.runs || []);
    } else {
      setError((current) => current || "Could not load run history.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSimulation = async () => {
    if (running) return null;

    setRunning(true);
    setError("");

    try {
      const response = await api.post("/red-blue/run", {});
      const nextReport = response.data.report;

      setReport(nextReport);
      await load();

      return nextReport;
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Simulation failed."
      );
      return null;
    } finally {
      setRunning(false);
    }
  };

  return {
    report,
    history,
    loading,
    running,
    error,
    load,
    runSimulation,
  };
}
