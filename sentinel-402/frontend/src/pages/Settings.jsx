
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Fingerprint,
  Globe,
  KeyRound,
  LockKeyhole,
  Network,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import "./ActivitySettings.css";

const environment = {
  network: "Base Sepolia",
  chainId: "eip155:84532",
  protocol: "x402 V2",
  scheme: "exact",
  asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  recipient: "0x179f0073e4105b37dadb28e87D581Aa443D81986",
  perTransactionLimit: "0.5 USDC",
  dailyLimit: "2 USDC",
  authExpiry: "8 hours",
};

function CopyValue({ value }) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      className="settings-copy-button"
      onClick={copyValue}
      title="Copy value"
    >
      {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function SettingRow({ label, value, copy = false, detail }) {
  return (
    <div className="settings-row">
      <div className="settings-row-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>

      {copy && typeof value === "string" && (
        <CopyValue value={value} />
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="settings-section-heading">
      <div className="settings-section-icon">
        <Icon size={20} />
      </div>

      <div>
        <div className="activity-eyebrow">{eyebrow}</div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  const [backendStatus, setBackendStatus] = useState("checking");
  const [lastChecked, setLastChecked] = useState(null);
  const [backendError, setBackendError] = useState("");

  const tokenPresent = Boolean(localStorage.getItem("sentinel_token"));

  async function checkBackend() {
    setBackendStatus("checking");
    setBackendError("");

    try {
      const response = await api.get("/health");

      setBackendStatus(
        response.data?.success ? "online" : "offline"
      );
    } catch (error) {
      setBackendStatus("offline");
      setBackendError(
        error.response?.data?.message ||
        "Backend health endpoint is unavailable."
      );
    } finally {
      setLastChecked(new Date());
    }
  }

  useEffect(() => {
    checkBackend();
  }, []);

  const accountInitial =
    (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="settings-page">

      <section className="activity-page-heading">
        <div>
          <div className="activity-eyebrow">
            <span className="activity-orange-dot" />
            ACCOUNT & ENVIRONMENT
          </div>

          <h2>Workspace <span>settings</span></h2>

          <p>
            Review the authenticated account, current demo network
            and the payment guard configuration.
          </p>
        </div>

        <button
          className="activity-secondary-button"
          onClick={checkBackend}
          disabled={backendStatus === "checking"}
        >
          <RefreshCw
            size={16}
            className={backendStatus === "checking" ? "activity-spin" : ""}
          />
          Check backend
        </button>
      </section>

      <section className="settings-status-strip">
        <div className="settings-status-icon">
          {backendStatus === "online"
            ? <CheckCircle2 size={22} />
            : backendStatus === "checking"
              ? <Activity size={22} />
              : <AlertTriangle size={22} />}
        </div>

        <div className="settings-status-copy">
          <strong>
            {backendStatus === "online"
              ? "Backend connected"
              : backendStatus === "checking"
                ? "Checking backend..."
                : "Backend unavailable"}
          </strong>

          <small>
            {backendError ||
              (backendStatus === "online"
                ? "SENTINEL 402 health endpoint responded successfully."
                : "Waiting for backend health response.")}
          </small>
        </div>

        <span className={`settings-connection ${
          backendStatus === "online"
            ? "connection-ok"
            : backendStatus === "checking"
              ? "connection-wait"
              : "connection-error"
        }`}>
          <i />
          {backendStatus.toUpperCase()}
        </span>
      </section>

      <div className="settings-main-grid">

        {/* ACCOUNT */}

        <section className="settings-card">
          <SectionHeader
            icon={Fingerprint}
            eyebrow="IDENTITY"
            title="Account information"
            description="Information returned by the authenticated user session."
          />

          <div className="settings-profile">
            <div className="settings-avatar">{accountInitial}</div>
            <div>
              <strong>{user?.name || "Name unavailable"}</strong>
              <small>{user?.email || "Email unavailable"}</small>
            </div>
            <span className="settings-role">
              {user?.role || "user"}
            </span>
          </div>

          <div className="settings-rows">
            <SettingRow
              label="Full name"
              value={user?.name || "Not provided"}
            />

            <SettingRow
              label="Email address"
              value={user?.email || "Not available"}
            />

            <SettingRow
              label="Account role"
              value={user?.role || "user"}
            />

            <SettingRow
              label="User ID"
              value={user?.id || "Not returned by session"}
              copy={Boolean(user?.id)}
            />
          </div>
        </section>

        {/* AUTHENTICATION */}

        <section className="settings-card">
          <SectionHeader
            icon={KeyRound}
            eyebrow="ACCESS CONTROL"
            title="Authentication"
            description="Current browser authentication state."
          />

          <div className="settings-auth-status">
            <div className="settings-auth-icon">
              <LockKeyhole size={22} />
            </div>

            <div>
              <strong>
                {tokenPresent ? "JWT token present" : "No JWT token found"}
              </strong>
              <small>
                {tokenPresent
                  ? "A bearer token is stored in this browser."
                  : "Sign in again to establish an authenticated session."}
              </small>
            </div>
          </div>

          <div className="settings-rows">
            <SettingRow
              label="Authentication method"
              value="JSON Web Token"
            />

            <SettingRow
              label="Token storage"
              value="Browser localStorage"
            />

            <SettingRow
              label="Token expiration"
              value={environment.authExpiry}
              detail="Configured by the backend authentication route."
            />

            <SettingRow
              label="Password storage"
              value="bcrypt hash"
              detail="Passwords are not returned in the user profile."
            />
          </div>

          <div className="settings-security-note">
            <ShieldCheck size={17} />
            Never share your JWT token, private key or wallet seed phrase.
          </div>
        </section>

        {/* NETWORK */}

        <section className="settings-card">
          <SectionHeader
            icon={Globe}
            eyebrow="BLOCKCHAIN ENVIRONMENT"
            title="Network configuration"
            description="Current Base Sepolia x402 demo configuration."
          />

          <div className="settings-network-banner">
            <div className="settings-network-symbol">
              <Network size={25} />
            </div>
            <div>
              <strong>{environment.network}</strong>
              <small>{environment.chainId}</small>
            </div>
            <span>TESTNET</span>
          </div>

          <div className="settings-rows">
            <SettingRow label="Blockchain network" value={environment.network} />
            <SettingRow label="Network identifier" value={environment.chainId} copy />
            <SettingRow label="Payment protocol" value={environment.protocol} />
            <SettingRow label="Payment scheme" value={environment.scheme} />
            <SettingRow
              label="USDC asset contract"
              value={environment.asset}
              copy
            />
          </div>
        </section>

        {/* PAYMENT POLICY */}

        <section className="settings-card">
          <SectionHeader
            icon={Wallet}
            eyebrow="BLUE TEAM"
            title="Demo payment policy"
            description="Read-only values from the current local demo policy."
          />

          <div className="settings-policy-warning">
            <AlertTriangle size={16} />
            These values are configured in the backend. This page does not edit them.
          </div>

          <div className="settings-rows">
            <SettingRow
              label="Maximum per transaction"
              value={environment.perTransactionLimit}
            />

            <SettingRow
              label="Daily spending limit"
              value={environment.dailyLimit}
            />

            <SettingRow
              label="Allowed recipients"
              value="1 configured recipient"
            />

            <SettingRow
              label="Trusted merchant wallet"
              value={environment.recipient}
              copy
            />
          </div>
        </section>
      </div>

      <section className="settings-diagnostic">
        <div>
          <div className="activity-eyebrow">SYSTEM DIAGNOSTICS</div>
          <h3>Connection information</h3>
          <p>
            Last health check:{" "}
            {lastChecked
              ? lastChecked.toLocaleString("en-IN")
              : "Not checked yet"}
          </p>
        </div>

        <div className="settings-diagnostic-status">
          <span className={`diagnostic-dot ${backendStatus}`} />
          {backendStatus === "online"
            ? "API responding"
            : backendStatus === "checking"
              ? "Checking..."
              : "API not responding"}
        </div>
      </section>
    </div>
  );
}
