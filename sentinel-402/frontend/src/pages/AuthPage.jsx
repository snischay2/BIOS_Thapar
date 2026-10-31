
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Fingerprint,
  LockKeyhole,
  ArrowRight,
  ArrowUpRight,
  Check,
  LoaderCircle,
  Eye,
  EyeOff,
  Zap,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function SecurityArtwork() {
  return (
    <div className="artwork-scene">
      <div className="artwork-glow artwork-glow-one" />
      <div className="artwork-glow artwork-glow-two" />

      <div className="artwork-grid" />

      <div className="artwork-orbit artwork-orbit-one" />
      <div className="artwork-orbit artwork-orbit-two" />
      <div className="artwork-orbit artwork-orbit-three" />

      <div className="artwork-shield">
        <div className="shield-back" />
        <div className="shield-front">
          <div className="shield-shine" />
          <ShieldCheck size={105} strokeWidth={1.35} />
        </div>
        <div className="shield-shadow" />
      </div>

      <div className="art-floating-card threat-card">
        <div className="floating-card-icon">
          <ShieldAlert size={19} />
        </div>
        <div>
          <strong>THREAT DETECTED</strong>
          <small>Unauthorized recipient</small>
        </div>
        <div className="floating-check">
          <Check size={15} />
        </div>
      </div>

      <div className="art-floating-card wallet-card">
        <div className="floating-card-icon wallet-icon">
          <Fingerprint size={19} />
        </div>
        <div>
          <strong>WALLET SECURED</strong>
          <small>Payment guard active</small>
        </div>
      </div>

      <div className="art-floating-card protocol-card">
        <Zap size={16} />
        <span>x402 PROTOCOL</span>
        <i />
      </div>

      <div className="art-particle particle-one" />
      <div className="art-particle particle-two" />
      <div className="art-particle particle-three" />
      <div className="art-particle particle-four" />
    </div>
  );
}

export default function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await login({
          email: email.trim(),
          password,
        });
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">

      {/* LEFT VISUAL PANEL */}

      <section className="auth-showcase">

        <div className="showcase-top">
          <Link to="/login" className="showcase-brand">
            <div className="showcase-brand-icon">
              <ShieldCheck size={25} />
            </div>

            <div>
              <strong>TXFORT <span>402</span></strong>
              <small>PAYMENT SECURITY PLATFORM</small>
            </div>
          </Link>

          <span className="showcase-version">BIOS HACKATHON / 2026</span>
        </div>

        <SecurityArtwork />

        <div className="showcase-copy">
          <div className="showcase-label">
            <span className="orange-dot" />
            TRUST EVERY TRANSACTION
          </div>

          <h1>
            Autonomous payments.
            <br />
            <span>Uncompromised security.</span>
          </h1>

          <p>
            Your AI agent can make payments.
            TXFORT makes sure it pays the right person,
            the right amount, every time.
          </p>

          <div className="showcase-features">
            <div>
              <CheckCircle2 size={16} />
              Overpayment protection
            </div>

            <div>
              <CheckCircle2 size={16} />
              Wrong-party detection
            </div>

            <div>
              <CheckCircle2 size={16} />
              x402 wallet guard
            </div>
          </div>
        </div>

        <div className="showcase-footer">
          <span>BUILT FOR x402</span>
          <i />
          <span>SDG 16.4</span>
          <i />
          <span>BASE SEPOLIA</span>
        </div>

      </section>

      {/* RIGHT AUTHENTICATION PANEL */}

      <section className="auth-panel">

        <div className="auth-mobile-brand">
          <div className="showcase-brand-icon">
            <ShieldCheck size={23} />
          </div>
          <strong>TXFORT <span>402</span></strong>
        </div>

        <div className="auth-box">

          <div className="auth-heading">
            <div className="auth-eyebrow">
              <span />
              SECURE ACCESS PORTAL
            </div>

            <h2>
              {isRegister ? (
                <>Build your <span>secure space.</span></>
              ) : (
                <>Welcome <span>back.</span></>
              )}
            </h2>

            <p>
              {isRegister
                ? "Create your account and take control of your agent's security."
                : "Sign in to your TXFORT security command center."}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>

            {isRegister && (
              <label className="auth-field">
                <span>Full name</span>

                <div className="auth-input">
                  <Fingerprint size={19} />

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={60}
                    required
                    autoComplete="name"
                  />
                </div>
              </label>
            )}

            <label className="auth-field">
              <span>Email address</span>

              <div className="auth-input">
                <span className="at-symbol">@</span>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="auth-field">
              <div className="password-label">
                <span>Password</span>
                {!isRegister && <span className="password-hint">SECURE LOGIN</span>}
              </div>

              <div className="auth-input">
                <LockKeyhole size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    isRegister
                      ? "Minimum 8 characters"
                      : "Enter your password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={isRegister ? 8 : undefined}
                  required
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                />

                <button
                  type="button"
                  className="password-visibility"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="auth-error">
                <ShieldAlert size={17} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle size={19} className="loading-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  {isRegister ? "Create secure account" : "Sign in to TXFORT"}
                  <ArrowUpRight size={19} />
                </>
              )}
            </button>

          </form>

          <div className="auth-divider">
            <span />
            <small>SECURE ACCESS</small>
            <span />
          </div>

          <div className="auth-switch">
            {isRegister
              ? "Already have an account?"
              : "New to TXFORT?"}

            <Link to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Sign in" : "Create account"}
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="auth-security-note">
            <div className="security-note-icon">
              <LockKeyhole size={16} />
            </div>

            <div>
              <strong>Your credentials stay protected.</strong>
              <small>
                Passwords are hashed on the backend.
                Authentication uses signed JWT sessions.
              </small>
            </div>
          </div>
        </div>

        <div className="auth-bottom">
          <span>© 2026 TXFORT</span>
          <span>BIOS HACKATHON</span>
        </div>

      </section>
    </main>
  );
}
