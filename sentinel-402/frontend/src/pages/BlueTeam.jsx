
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Fingerprint,
  Globe,
  LockKeyhole,
  Network,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import api from "../lib/api";
import "./TeamPages.css";

const guardChecks = [
  {
    icon: Globe,
    title: "Trusted merchant origin",
    description: "Rejects payment challenges from merchant origins not registered in the policy.",
  },
  {
    icon: Network,
    title: "Network validation",
    description: "Checks that the requested blockchain network is in the allowed network list.",
  },
  {
    icon: Wallet,
    title: "Approved token asset",
    description: "Verifies the token contract against the configured asset allowlist.",
  },
  {
    icon: Fingerprint,
    title: "Recipient verification",
    description: "Checks the payment recipient against the trusted merchant and recipient allowlist.",
  },
  {
    icon: LockKeyhole,
    title: "Transaction spending limit",
    description: "Rejects payment amounts that exceed the configured per-transaction limit.",
  },
  {
    icon: Zap,
    title: "Daily spending limit",
    description: "Checks the available daily spending budget before authorizing the payment.",
  },
  {
    icon: Clock3,
    title: "Timeout validation",
    description: "Rejects invalid or excessively long payment authorization timeouts.",
  },
  {
    icon: ShieldAlert,
    title: "Malformed challenge detection",
    description: "Validates protocol version, scheme, amount, address and payment option structure.",
  },
];

function GuardCheck({ item }) {
  const Icon = item.icon;

  return (
    <article className="blue-guard-check">
      <div className="blue-check-icon">
        <Icon size={19} />
      </div>

      <div className="blue-check-copy">
        <strong>{item.title}</strong>
        <p>{item.description}</p>
      </div>

      <span className="blue-implemented">
        <Check size={13} />
        IMPLEMENTED
      </span>
    </article>
  );
}

export default function BlueTeam() {
  const [backend, setBackend] = useState("checking");
  const [checkedAt, setCheckedAt] = useState(null);
  const [error, setError] = useState("");

  async function checkBackend() {
    setBackend("checking");
    setError("");

    try {
      const response = await api.get("/health");

      if (response.data?.success) {
        setBackend("online");
      } else {
        setBackend("offline");
        setError("Backend health check did not return success.");
      }
    } catch (err) {
      setBackend("offline");
      setError(
        err.response?.data?.message ||
        "The TXFORT backend is currently unreachable."
      );
    } finally {
      setCheckedAt(new Date());
    }
  }

  useEffect(() => {
    checkBackend();
  }, []);

  return (
    <div className="team-page blue-team-page">

      <section className="team-page-heading blue-page-heading">
        <div className="team-heading-copy">
          <div className="team-eyebrow">
            <span className="team-eyebrow-dot" />
            DEFENSIVE SECURITY LAYER
          </div>

          <h2>Blue Team <span>Payment Guard</span></h2>

          <p>
            Enforce payment policies before an agent wallet authorizes
            an x402 transaction.
          </p>
        </div>

        <button
          className="team-secondary-button"
          onClick={checkBackend}
          disabled={backend === "checking"}
        >
          <RefreshCw
            size={16}
            className={backend === "checking" ? "team-spin" : ""}
          />
          Check connection
        </button>
      </section>

      {error && (
        <div className="team-alert team-alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="blue-status-banner">
        <div className="blue-status-emblem">
          <ShieldCheck size={34} />
        </div>

        <div className="blue-status-copy">
          <div className="team-eyebrow">PAYMENT GUARD ENGINE</div>
          <h3>
            {backend === "online"
              ? "Backend connection verified"
              : backend === "checking"
                ? "Checking backend connection..."
                : "Backend connection unavailable"}
          </h3>

          <p>
            {backend === "online"
              ? "The TXFORT API health endpoint is responding successfully."
              : backend === "checking"
                ? "Waiting for the health endpoint response."
                : "Start the backend and verify the API before running payment tests."}
          </p>
        </div>

        <span className={`blue-connection-badge ${
          backend === "online"
            ? "connection-online"
            : backend === "checking"
              ? "connection-checking"
              : "connection-offline"
        }`}>
          <i />
          {backend === "online"
            ? "CONNECTED"
            : backend === "checking"
              ? "CHECKING"
              : "OFFLINE"}
        </span>
      </section>

      <section className="blue-overview-grid">
        <article className="blue-overview-card">
          <div className="blue-overview-icon"><ShieldCheck size={21} /></div>
          <div>
            <span>GUARD MODE</span>
            <strong>Pre-authorization</strong>
            <small>Challenge evaluation before wallet authorization</small>
          </div>
        </article>

        <article className="blue-overview-card">
          <div className="blue-overview-icon"><Network size={21} /></div>
          <div>
            <span>NETWORK</span>
            <strong>Base Sepolia</strong>
            <small>Configured demo chain · eip155:84532</small>
          </div>
        </article>

        <article className="blue-overview-card">
          <div className="blue-overview-icon"><LockKeyhole size={21} /></div>
          <div>
            <span>POLICY MANAGEMENT</span>
            <strong>Backend controlled</strong>
            <small>Policy values are defined server-side</small>
          </div>
        </article>
      </section>

      <section className="blue-checks-panel">
        <div className="blue-checks-header">
          <div>
            <div className="team-eyebrow">IMPLEMENTED DEFENCES</div>
            <h3>Payment authorization checks</h3>
            <p>
              These checks are enforced by the current backend payment guard.
            </p>
          </div>

          <div className="blue-check-count">
            <CheckCircle2 size={17} />
            {guardChecks.length} checks documented
          </div>
        </div>

        <div className="blue-check-list">
          {guardChecks.map((item) => (
            <GuardCheck key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="blue-verification-panel">
        <div className="blue-verification-heading">
          <div className="blue-verification-symbol">
            <Network size={22} />
          </div>

          <div>
            <div className="team-eyebrow">BLOCKCHAIN INTEGRATION</div>
            <h3>Settlement verification</h3>
          </div>

          <span className="blue-pending-badge">PENDING INTEGRATION</span>
        </div>

        <p>
          The current guard validates the x402 payment challenge before
          authorization. Independent on-chain settlement verification
          has not yet been integrated.
        </p>

        <div className="blue-pending-list">
          <div>
            <XCircle size={16} />
            Verify transaction receipt and successful status
          </div>
          <div>
            <XCircle size={16} />
            Verify the expected USDC Transfer event
          </div>
          <div>
            <XCircle size={16} />
            Match actual sender, recipient and amount with the payment reservation
          </div>
        </div>
      </section>

      <section className="blue-bottom-strip">
        <div className="blue-bottom-icon">
          <Shield size={19} />
        </div>

        <div>
          <strong>Policy values are managed on the backend</strong>
          <p>
            This page is a read-only view of implemented guard capabilities.
            It does not change spending limits or recipient allowlists.
          </p>
        </div>
      </section>

      <div className="team-page-link">
        <NavLink to="/red-team">
          Test the guard using Red Team <ArrowRight size={15} />
        </NavLink>
      </div>

      {checkedAt && (
        <div className="team-last-checked">
          Last connection check: {checkedAt.toLocaleTimeString("en-IN")}
        </div>
      )}
    </div>
  );
}
