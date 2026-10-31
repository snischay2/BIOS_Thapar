
import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
  Network,
  Play,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";

import api from "../lib/api";

const MERCHANT_URL = "http://localhost:5001/weather";
const NETWORK = "Base Sepolia";
const PAYMENT_AMOUNT = "0.001 USDC";

function copyText(value) {
  if (value && navigator.clipboard) {
    navigator.clipboard.writeText(value).catch(() => {});
  }
}

function shorten(value) {
  if (!value || typeof value !== "string") return "—";
  if (value.length < 20) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function DetailRow({ label, value, copyable = false }) {
  return (
    <div className="payment-detail-row">
      <div>
        <span>{label}</span>
        <strong>{value || "—"}</strong>
      </div>

      {copyable && value && (
        <button
          onClick={() => copyText(value)}
          title={`Copy ${label}`}
        >
          <Copy size={14} />
        </button>
      )}
    </div>
  );
}

function StatusPanel({ result }) {
  const settlement = result.settlement || null;
  const status = String(result.paymentStatus || "UNKNOWN").toUpperCase();

  const txHash =
    result.transactionHash ||
    settlement?.transaction ||
    null;

  const validHash =
    typeof txHash === "string" &&
    /^0x[a-fA-F0-9]{64}$/.test(txHash);

  const settled = status === "SETTLED";

  const pending = [
    "UNCONFIRMED",
    "PENDING",
    "PENDING_RECONCILIATION",
    "SETTLEMENT_PENDING",
  ].includes(status);

  const blocked = [
    "BLOCKED",
    "REJECTED",
  ].includes(status);

  const failed = !settled && !pending && !blocked;

  const errorReason =
    result.errorReason ||
    settlement?.errorReason ||
    null;

  const responseStatus =
    result.responseStatus ||
    result.httpStatus ||
    null;

  const settlementMessage =
    settlement?.errorMessage ||
    settlement?.message ||
    null;

  return (
    <section className={`payment-result-panel ${
      settled ? "payment-result-success" :
      pending ? "payment-result-pending" :
      "payment-result-failure"
    }`}>
      <div className="payment-result-heading">
        <div className="payment-result-icon">
          {settled
            ? <CheckCircle2 size={27} />
            : blocked
              ? <ShieldAlert size={27} />
              : failed
                ? <XCircle size={27} />
                : <Clock3 size={27} />}
        </div>

        <div>
          <div className="payment-eyebrow">PAYMENT EXECUTION RESULT</div>
          <h3>
            {settled
              ? "Payment settled successfully"
              : blocked
                ? "Payment blocked by security guard"
                : pending
                  ? "Payment needs reconciliation"
                  : "Payment was not completed"}
          </h3>
          <p>{result.message || "Backend execution response received."}</p>
        </div>

        <span className="payment-status-badge">{status}</span>
      </div>

      <div className="payment-result-grid">
        <div>
          <small>PAYMENT STATUS</small>
          <strong>{status}</strong>
        </div>

        <div>
          <small>NETWORK</small>
          <strong>{result.network || settlement?.network || NETWORK}</strong>
        </div>

        <div>
          <small>RESERVATION ID</small>
          <strong>{shorten(result.reservationId)}</strong>
        </div>

        <div>
          <small>PAYER</small>
          <strong>{shorten(result.payer || settlement?.payer)}</strong>
        </div>
      </div>

      {responseStatus && (
        <DetailRow
          label="Merchant HTTP response"
          value={String(responseStatus)}
        />
      )}

      {result.reservationId && (
        <DetailRow
          label="Reservation ID"
          value={result.reservationId}
          copyable
        />
      )}

      {(result.payer || settlement?.payer) && (
        <DetailRow
          label="Agent wallet"
          value={result.payer || settlement.payer}
          copyable
        />
      )}

      {validHash && (
        <div className="payment-transaction">
          <div className="payment-transaction-copy">
            <div className="payment-eyebrow">BLOCKCHAIN TRANSACTION</div>
            <strong>{shorten(txHash)}</strong>
          </div>

          <button onClick={() => copyText(txHash)} title="Copy transaction hash">
            <Copy size={15} />
          </button>

          <a
            href={`https://base-sepolia.blockscout.com/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View on Blockscout <ExternalLink size={14} />
          </a>
        </div>
      )}

      {result.data?.report && (
        <div className="payment-delivered-data">
          <div className="payment-eyebrow">MERCHANT RESPONSE</div>
          <h4>Paid resource delivered</h4>

          <div className="payment-weather-grid">
            {Object.entries(result.data.report).map(([key, value]) => (
              <div key={key}>
                <span>{key.replace(/([A-Z])/g, " $1")}</span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>

          {result.data.message && <p>{result.data.message}</p>}
        </div>
      )}

      {Array.isArray(result.reasons) && result.reasons.length > 0 && (
        <div className="payment-reasons">
          <strong>Security decision details</strong>
          {result.reasons.map((reason, index) => (
            <p key={index}>
              {typeof reason === "string"
                ? reason
                : reason.message || JSON.stringify(reason)}
            </p>
          ))}
        </div>
      )}

      {(errorReason || settlementMessage || responseStatus || settlement) && (
        <div className="payment-reasons">
          <strong>Facilitator settlement diagnostics</strong>

          {errorReason && (
            <p>
              <b>Error reason:</b> {errorReason}
            </p>
          )}

          {responseStatus && (
            <p>
              <b>HTTP response:</b> {responseStatus}
            </p>
          )}

          {settlementMessage && <p>{settlementMessage}</p>}

          {settlement && (
            <details className="payment-settlement-details">
              <summary>View settlement response</summary>
              <pre>{JSON.stringify(settlement, null, 2)}</pre>
            </details>
          )}
        </div>
      )}

      {failed && result.error && (
        <div className="payment-reasons">
          <strong>Execution error</strong>
          <p>{result.error}</p>
        </div>
      )}

      {pending && (
        <div className="payment-pending-note">
          <AlertTriangle size={16} />
          Do not repeat the payment until the reservation and settlement
          status have been reconciled by the backend.
        </div>
      )}
    </section>
  );
}

export default function Payments() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function executePayment() {
    if (running) return;

    setRunning(true);
    setError("");
    setResult(null);
    setConfirmOpen(false);

    try {
      // Signing and private-key access remain on the backend.
      const response = await api.post("/agent/weather", {});
      const envelope = response.data || {};

      const payload =
        envelope.result ||
        envelope.payment ||
        envelope;

      if (!payload || !payload.paymentStatus) {
        throw new Error(
          envelope.message ||
          "The payment endpoint returned an unexpected response."
        );
      }

      setResult({
        ...payload,
        responseStatus:
          payload.responseStatus ??
          payload.httpStatus ??
          response.status,
        message:
          payload.message ||
          envelope.message ||
          "Backend execution response received."
      });
    } catch (err) {
      const responseData = err.response?.data || {};
      const payload =
        responseData.result ||
        responseData.payment ||
        responseData;

      const failedResult = {
        ...payload,
        success: false,
        paymentStatus:
          payload.paymentStatus ||
          payload.status ||
          "REQUEST_FAILED",
        responseStatus:
          payload.responseStatus ||
          payload.httpStatus ||
          err.response?.status ||
          null,
        errorReason:
          payload.errorReason ||
          payload.settlement?.errorReason ||
          null,
        message:
          payload.message ||
          responseData.message ||
          err.message ||
          "Payment request failed.",
        error:
          payload.error ||
          responseData.error ||
          null,
      };

      setResult(failedResult);
      setError(failedResult.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="payment-page">

      {/* PAGE HEADER */}

      <section className="payment-page-heading">
        <div>
          <div className="payment-eyebrow">
            <span />
            x402 PAYMENT WORKSPACE
          </div>

          <h2>Agent <span>Payments</span></h2>

          <p>
            Execute a real Base Sepolia x402 payment through your
            guarded AI agent, and inspect the actual settlement result.
          </p>
        </div>

        <div className="payment-network-badge">
          <Network size={17} />
          BASE SEPOLIA TESTNET
        </div>
      </section>

      {/* SAFETY NOTICE */}

      <div className="payment-testnet-notice">
        <ShieldCheck size={19} />
        <div>
          <strong>Backend-controlled wallet signing</strong>
          <p>
            Your private key stays inside the backend environment.
            Sentinel checks the payment challenge before the agent signs.
          </p>
        </div>
      </div>

      {/* MAIN GRID */}

      <div className="payment-main-grid">

        {/* PAYMENT CARD */}

        <section className="payment-card">
          <div className="payment-card-heading">
            <div>
              <div className="payment-eyebrow">DEMO MERCHANT</div>
              <h3>Premium Weather API</h3>
              <p>x402-protected resource hosted by Sentinel.</p>
            </div>

            <div className="payment-merchant-icon">
              <GlobeIcon />
            </div>
          </div>

          <div className="payment-product-illustration">
            <div className="payment-product-orbit" />
            <div className="payment-product-core">
              <Wallet size={49} />
            </div>
            <div className="payment-product-particle particle-a" />
            <div className="payment-product-particle particle-b" />
            <div className="payment-product-particle particle-c" />
          </div>

          <div className="payment-price-area">
            <span>PAYMENT AMOUNT</span>
            <strong>0.001 <small>USDC</small></strong>
            <p>One x402 payment · Exact scheme</p>
          </div>

          <div className="payment-information">
            <DetailRow label="Merchant resource" value={MERCHANT_URL} />
            <DetailRow label="Network" value={NETWORK} />
            <DetailRow label="Payment protocol" value="x402 V2" />
            <DetailRow label="Payment scheme" value="exact" />
            <DetailRow label="Settlement provider" value="x402 facilitator" />
          </div>

          <button
            className="payment-review-button"
            onClick={() => setConfirmOpen(true)}
            disabled={running}
          >
            <Play size={17} fill="currentColor" />
            Review testnet payment
            <ArrowUpRight size={17} />
          </button>

          <div className="payment-cost-note">
            <LockKeyhole size={14} />
            This uses testnet tokens, not mainnet USDC.
          </div>
        </section>

        {/* SECURITY FLOW */}

        <section className="payment-flow-card">
          <div className="payment-eyebrow">TRANSACTION SECURITY PIPELINE</div>
          <h3>What happens after confirmation?</h3>
          <p className="payment-flow-description">
            The transaction follows the existing backend guarded-agent flow.
          </p>

          <div className="payment-flow-list">
            <div className="payment-flow-step">
              <div className="payment-flow-number">01</div>
              <div className="payment-flow-step-icon">
                <GlobeIcon />
              </div>
              <div>
                <strong>Merchant challenge</strong>
                <small>Receive HTTP 402 payment requirements</small>
              </div>
              <CheckCircle2 size={17} className="payment-flow-check" />
            </div>

            <div className="payment-flow-connector" />

            <div className="payment-flow-step">
              <div className="payment-flow-number">02</div>
              <div className="payment-flow-step-icon">
                <ShieldCheck size={19} />
              </div>
              <div>
                <strong>Blue Team guard</strong>
                <small>Validate recipient, amount, asset and network</small>
              </div>
              <CheckCircle2 size={17} className="payment-flow-check" />
            </div>

            <div className="payment-flow-connector" />

            <div className="payment-flow-step">
              <div className="payment-flow-number">03</div>
              <div className="payment-flow-step-icon">
                <Fingerprint size={19} />
              </div>
              <div>
                <strong>Wallet signing</strong>
                <small>Backend agent signs only after guard approval</small>
              </div>
              <CheckCircle2 size={17} className="payment-flow-check" />
            </div>

            <div className="payment-flow-connector" />

            <div className="payment-flow-step">
              <div className="payment-flow-number">04</div>
              <div className="payment-flow-step-icon">
                <Zap size={19} />
              </div>
              <div>
                <strong>Facilitator settlement</strong>
                <small>Process payment and return settlement receipt</small>
              </div>
              <Clock3 size={17} className="payment-flow-wait" />
            </div>
          </div>

          <div className="payment-flow-footer">
            <ShieldAlert size={17} />
            Any guard rejection should stop the signing process.
          </div>
        </section>
      </div>

      {/* ERROR */}

      {error && (
        <div className="payment-error">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      {/* RUNNING */}

      {running && (
        <div className="payment-running">
          <LoaderCircle size={23} className="payment-spin" />
          <div>
            <strong>Executing x402 payment...</strong>
            <p>
              Contacting merchant, evaluating the challenge and awaiting
              the backend settlement response. Do not close this page.
            </p>
          </div>
        </div>
      )}

      {/* ACTUAL RESULT */}

      {result && <StatusPanel result={result} />}

      {/* CONFIRMATION */}

      {confirmOpen && (
        <div
          className="payment-modal-backdrop"
          onMouseDown={() => setConfirmOpen(false)}
        >
          <section
            className="payment-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="payment-confirm-icon">
              <CircleDollarSign size={31} />
            </div>

            <div className="payment-eyebrow">FINAL PAYMENT REVIEW</div>

            <h3 id="payment-confirm-title">Authorize demo payment?</h3>

            <div className="payment-confirm-amount">
              <strong>{PAYMENT_AMOUNT}</strong>
              <span>Base Sepolia</span>
            </div>

            <div className="payment-confirm-warning">
              This will initiate an actual testnet payment from the
              agent wallet configured on your backend. It consumes
              testnet USDC. It is not a mainnet transaction.
            </div>

            <div className="payment-confirm-actions">
              <button
                className="payment-cancel-button"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>

              <button
                className="payment-confirm-button"
                onClick={executePayment}
              >
                <LockKeyhole size={16} />
                Confirm & execute
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="payment-disclaimer">
        <ShieldCheck size={15} />
        Sentinel does not expose signing keys to the frontend.
        All payment authorization is performed by the backend agent.
      </div>
    </div>
  );
}

function GlobeIcon() {
  return <Network size={22} />;
}
