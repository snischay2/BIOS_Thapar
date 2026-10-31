
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Fingerprint,
  Globe2,
  LockKeyhole,
  Menu,
  Network,
  Play,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Brand({ dark = false }) {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className={`grid h-11 w-11 place-items-center rounded-[14px] shadow-lg transition-transform group-hover:-rotate-6 group-hover:scale-105 ${
        dark
          ? "bg-gradient-to-br from-orange-400 to-red-600 text-white"
          : "bg-gradient-to-br from-orange-300 to-orange-500 text-white"
      }`}>
        <ShieldCheck size={25} />
      </div>

      <div>
        <div className={`font-['Space_Grotesk'] text-[17px] font-bold tracking-tight ${
          dark ? "text-[#352920]" : "text-[#fff9ed]"
        }`}>
          SENTINEL <span className={dark ? "text-[#e9623d]" : "text-[#ffe09a]"}>402</span>
        </div>
        <div className={`mt-0.5 text-[8px] font-extrabold tracking-[1.6px] ${
          dark ? "text-[#a08b78]" : "text-[#ffe0cb]"
        }`}>
          PAYMENT SECURITY PLATFORM
        </div>
      </div>
    </Link>
  );
}

function ThreeDShield() {
  return (
    <div className="relative mx-auto flex h-[410px] w-full max-w-[510px] items-center justify-center [perspective:1000px]">
      <div className="absolute h-[280px] w-[280px] rounded-full bg-[#ffd477]/35 blur-[65px]" />

      <div className="absolute h-[210px] w-[210px] rounded-full border border-[#f8d7b1]/70 [transform:rotateX(68deg)]" />
      <div className="absolute h-[285px] w-[285px] rounded-full border border-dashed border-[#f7d6b3]/65 animate-[spin_28s_linear_infinite]" />
      <div className="absolute h-[355px] w-[355px] rounded-full border border-[#f9dfc7]/55" />

      <div className="relative z-10 grid h-[180px] w-[155px] place-items-center rounded-[46%_46%_43%_43%] border border-white/80 bg-gradient-to-br from-[#ffe7b9] via-[#f58d59] to-[#bd482f] text-[#fff9e9] shadow-[inset_9px_9px_15px_#ffffff8c,inset_-10px_-12px_20px_#8e302b70,0_30px_45px_#a53f2c55] [transform:rotateY(-16deg)_rotateX(9deg)] animate-[floatShield_5s_ease-in-out_infinite]">
        <div className="absolute left-7 top-4 h-12 w-9 rounded-full bg-white/70 blur-xl" />
        <ShieldCheck size={92} strokeWidth={1.25} className="drop-shadow-[0_8px_5px_#85321f88]" />
      </div>

      <div className="absolute left-[2%] top-[21%] flex items-center gap-2 rounded-xl border border-white/80 bg-[#fffaf0] px-3 py-3 text-[#584233] shadow-xl animate-[floatCard_4s_ease-in-out_infinite]">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#ffeadc] text-[#df6642]">
          <ShieldAlert size={18} />
        </div>
        <div>
          <strong className="block text-[9px] font-black tracking-wide">THREAT DETECTED</strong>
          <small className="text-[9px] text-[#a18a74]">Wrong recipient</small>
        </div>
        <CheckCircle2 size={17} className="text-[#df704b]" />
      </div>

      <div className="absolute bottom-[19%] right-[0%] flex items-center gap-2 rounded-xl border border-white/80 bg-[#fffaf0] px-3 py-3 text-[#584233] shadow-xl animate-[floatCard_4.5s_ease-in-out_infinite]">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#fff0d3] text-[#bd803c]">
          <Fingerprint size={19} />
        </div>
        <div>
          <strong className="block text-[9px] font-black tracking-wide">WALLET GUARDED</strong>
          <small className="text-[9px] text-[#a18a74]">Policy enforced</small>
        </div>
      </div>

      <div className="absolute bottom-[7%] left-[8%] flex items-center gap-2 rounded-full border border-white/70 bg-[#fff5e7] px-3 py-2 text-[8px] font-black tracking-widest text-[#a65e38] shadow-lg">
        <Zap size={14} /> x402 PAYMENT PROTOCOL
      </div>

      <span className="absolute left-[25%] top-[10%] h-2 w-2 rounded-full bg-[#ffe8a5] shadow-[0_0_16px_#ffe8a5]" />
      <span className="absolute right-[13%] top-[35%] h-2 w-2 rounded-full bg-[#ffe8a5] shadow-[0_0_16px_#ffe8a5]" />
      <span className="absolute bottom-[18%] right-[28%] h-2 w-2 rounded-full bg-[#ffe8a5] shadow-[0_0_16px_#ffe8a5]" />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-[1.8px] text-[#c26c49]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#ef754e]" />
      {children}
    </div>
  );
}

function FeatureCard({ icon: Icon, number, title, description, tone = "orange" }) {
  const tones = {
    orange: "bg-[#ffeadc] text-[#d45c39]",
    yellow: "bg-[#fff0d4] text-[#a87937]",
    coral: "bg-[#ffebe7] text-[#cf614e]",
  };

  return (
    <article className="group rounded-2xl border border-[#eee3d5] bg-[#fffefa] p-6 shadow-[0_5px_18px_#49362908] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_#49362912]">
      <div className="mb-7 flex items-center justify-between">
        <div className={`grid h-12 w-12 place-items-center rounded-[14px] ${tones[tone]}`}>
          <Icon size={23} />
        </div>
        <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#eadfd3]">
          {number}
        </span>
      </div>

      <h3 className="font-['Space_Grotesk'] text-[19px] font-bold text-[#49362a]">
        {title}
      </h3>

      <p className="mt-2 text-[12px] leading-7 text-[#958576]">
        {description}
      </p>
    </article>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const appLink = user ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f4ec] text-[#372b23]">

      {/* NAVIGATION */}

      <header className="sticky top-0 z-50 border-b border-[#f0e5d8] bg-[#fffefa]/95 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-5 px-5 py-4 lg:px-10">
          <Brand dark />

          <div className="hidden items-center gap-7 lg:flex">
            <a href="#challenge" className="text-[12px] font-bold text-[#806f5e] transition hover:text-[#e56843]">
              The challenge
            </a>
            <a href="#defence" className="text-[12px] font-bold text-[#806f5e] transition hover:text-[#e56843]">
              Red / Blue
            </a>
            <a href="#workflow" className="text-[12px] font-bold text-[#806f5e] transition hover:text-[#e56843]">
              How it works
            </a>
            <a href="#impact" className="text-[12px] font-bold text-[#806f5e] transition hover:text-[#e56843]">
              SDG 16.4
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard"
              className="hidden rounded-lg px-3 py-2 text-[11px] font-extrabold text-[#866e59] transition hover:bg-[#fff0e2] sm:inline-flex"
            >
              Dashboard
            </Link>

            <Link
              to="/evaluator"
              className="hidden rounded-lg px-3 py-2 text-[11px] font-extrabold text-[#866e59] transition hover:bg-[#fff0e2] sm:inline-flex"
            >
              Evaluator
            </Link>

            <Link
              to="/payments"
              className="hidden rounded-lg px-3 py-2 text-[11px] font-extrabold text-[#866e59] transition hover:bg-[#fff0e2] md:inline-flex"
            >
              Payments
            </Link>

            <Link
              to={user ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e86440] px-4 py-3 text-[11px] font-black text-white shadow-lg shadow-[#e864402a] transition hover:-translate-y-0.5 hover:bg-[#d85232]"
            >
              {user ? "Open console" : "Launch console"}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}

      <section className="relative overflow-hidden bg-gradient-to-br from-[#f36f49] via-[#e85b39] to-[#c94730] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[.13] [background-image:radial-gradient(#fff5df_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -right-40 top-0 h-[600px] w-[600px] rounded-full border border-white/20 shadow-[0_0_0_45px_#ffffff0a,0_0_0_90px_#ffffff08]" />

        <div className="relative mx-auto grid min-h-[650px] max-w-[1400px] items-center gap-3 px-5 py-12 md:grid-cols-[1.04fr_.96fr] lg:px-10 lg:py-14">
          <div className="relative z-10 py-5">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[9px] font-black tracking-[1.6px] text-[#fff0d7] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#ffe09a] shadow-[0_0_12px_#ffe09a]" />
              x402 RED / BLUE · BIOS HACKATHON 2026
            </div>

            <h1 className="max-w-[700px] font-['Space_Grotesk'] text-[43px] font-bold leading-[1.08] tracking-[-2.3px] sm:text-[55px] lg:text-[65px]">
              Autonomous payments.
              <br />
              <span className="text-[#ffe29e]">Accountable security.</span>
            </h1>

            <p className="mt-7 max-w-[570px] text-[14px] leading-8 text-[#ffe7d9] sm:text-[15px]">
              AI agents are becoming economic actors. Sentinel 402 protects
              their wallets against overpayment and wrong-party attacks —
              then puts every guard to the test.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={appLink}
                className="inline-flex items-center gap-3 rounded-xl bg-[#fff0cf] px-5 py-4 text-[12px] font-black text-[#783e29] shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                Explore Sentinel <ArrowRight size={17} />
              </Link>

              <Link
                to={user ? "/evaluator" : "/login"}
                className="inline-flex items-center gap-3 rounded-xl border border-white/50 bg-white/10 px-5 py-4 text-[12px] font-black text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Evaluate a guard <Crosshair size={17} />
              </Link>
            </div>

            <div className="mt-12 grid max-w-[570px] grid-cols-3 gap-4 border-t border-white/25 pt-6">
              <div>
                <strong className="block font-['Space_Grotesk'] text-[18px] font-bold text-white">
                  Pre-sign
                </strong>
                <span className="mt-1 block text-[9px] text-[#ffe0d0]">
                  Wallet protection
                </span>
              </div>
              <div>
                <strong className="block font-['Space_Grotesk'] text-[18px] font-bold text-white">
                  Red / Blue
                </strong>
                <span className="mt-1 block text-[9px] text-[#ffe0d0]">
                  Adversarial evaluation
                </span>
              </div>
              <div>
                <strong className="block font-['Space_Grotesk'] text-[18px] font-bold text-white">
                  x402 V2
                </strong>
                <span className="mt-1 block text-[9px] text-[#ffe0d0]">
                  Payment protocol
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 hidden md:block">
            <ThreeDShield />
          </div>
        </div>

        <div className="relative mx-auto flex max-w-[1400px] items-center gap-2 px-5 pb-6 text-[9px] font-black tracking-[1.4px] text-[#ffe2d2] lg:px-10">
          <ArrowDown size={14} />
          EXPLORE THE x402 RED / BLUE CHALLENGE
        </div>
      </section>

      {/* PROBLEM STATEMENT */}

      <section id="challenge" className="scroll-mt-24 px-5 py-24 lg:px-10">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div>
            <SectionLabel>THE PROBLEM WE SOLVE</SectionLabel>
            <h2 className="font-['Space_Grotesk'] text-[34px] font-bold leading-tight tracking-[-1.3px] text-[#3e3027] sm:text-[43px]">
              The agent can pay.
              <br />
              <span className="text-[#e56843]">But can it pay safely?</span>
            </h2>
            <p className="mt-5 max-w-[430px] text-[13px] leading-7 text-[#948474]">
              Autonomous agents can request and make machine-to-machine
              payments. A malicious merchant, inflated price or altered
              recipient can turn that convenience into financial risk.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[22px] border border-[#eddfd0] bg-[#fffefa] p-7 shadow-[0_15px_40px_#4936290d] sm:p-10">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#ffe6d4] blur-2xl" />
            <div className="relative">
              <div className="mb-5 text-[9px] font-black tracking-[1.5px] text-[#bd8766]">
                OFFICIAL PROBLEM STATEMENT
              </div>

              <p className="font-['Space_Grotesk'] text-[23px] font-semibold leading-[1.45] text-[#49372b] sm:text-[29px]">
                “Guard an AI agent's crypto wallet on the x402 payment
                protocol against overpayment and wrong-party attacks,
                then test other teams' guards.”
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-[#ffeadb] px-3 py-2 text-[9px] font-black tracking-wide text-[#c45e3b]">
                  x402 RED / BLUE
                </span>
                <span className="rounded-lg bg-[#fff1d4] px-3 py-2 text-[9px] font-black tracking-wide text-[#a47b3f]">
                  WALLET SECURITY
                </span>
                <span className="rounded-lg bg-[#ffebe6] px-3 py-2 text-[9px] font-black tracking-wide text-[#bd6350]">
                  INTER-TEAM TESTING
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RED BLUE */}

      <section id="defence" className="scroll-mt-24 bg-[#f1e9df] px-5 py-24 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto mb-12 max-w-[650px] text-center">
            <SectionLabel>ONE PLATFORM · TWO SIDES</SectionLabel>
            <h2 className="font-['Space_Grotesk'] text-[35px] font-bold tracking-[-1.3px] text-[#443329] sm:text-[44px]">
              Attack it. <span className="text-[#e56843]">Defend it.</span>
            </h2>
            <p className="mt-4 text-[13px] leading-7 text-[#938373]">
              A security guard is only as strong as the attacks it can
              withstand. Sentinel brings both roles into one testable system.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <article className="group relative overflow-hidden rounded-[21px] border border-[#f0d5c6] bg-[#fffaf4] p-7 transition hover:-translate-y-1 hover:shadow-xl sm:p-9">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ffdfcc] opacity-60 blur-3xl transition group-hover:scale-125" />

              <div className="relative">
                <div className="mb-8 flex items-center justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ffe7dc] text-[#dc6543] shadow-inner">
                    <Crosshair size={28} />
                  </div>
                  <span className="font-['Space_Grotesk'] text-[29px] font-bold text-[#f0d4c4]">
                    01
                  </span>
                </div>

                <div className="text-[9px] font-black tracking-[1.5px] text-[#ce7251]">
                  ADVERSARIAL SIDE
                </div>

                <h3 className="mt-2 font-['Space_Grotesk'] text-[28px] font-bold text-[#4b3629]">
                  RED TEAM
                </h3>

                <p className="mt-3 text-[12px] leading-7 text-[#947f6d]">
                  Simulate malicious payment challenges: excessive amounts,
                  wrong recipients, untrusted merchants and malformed
                  x402 requests.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    "Overpayment attempts",
                    "Wrong-party recipient changes",
                    "Untrusted merchant origins",
                    "Invalid network and token options",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[11px] font-semibold text-[#795b48]">
                      <ShieldAlert size={15} className="text-[#dc7251]" />
                      {item}
                    </div>
                  ))}
                </div>

                <Link to={user ? "/red-team" : "/login"} className="mt-8 inline-flex items-center gap-2 text-[11px] font-black text-[#d75b38]">
                  Open Red Team <ArrowRight size={16} />
                </Link>
              </div>
            </article>

            <article className="group relative overflow-hidden rounded-[21px] border border-[#e9dcc6] bg-[#fffefa] p-7 transition hover:-translate-y-1 hover:shadow-xl sm:p-9">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ffe9c8] opacity-70 blur-3xl transition group-hover:scale-125" />

              <div className="relative">
                <div className="mb-8 flex items-center justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0d9] text-[#bd843e] shadow-inner">
                    <ShieldCheck size={28} />
                  </div>
                  <span className="font-['Space_Grotesk'] text-[29px] font-bold text-[#eee0c9]">
                    02
                  </span>
                </div>

                <div className="text-[9px] font-black tracking-[1.5px] text-[#ae8754]">
                  DEFENSIVE SIDE
                </div>

                <h3 className="mt-2 font-['Space_Grotesk'] text-[28px] font-bold text-[#4b3629]">
                  BLUE TEAM
                </h3>

                <p className="mt-3 text-[12px] leading-7 text-[#947f6d]">
                  Inspect each payment requirement before signing. Enforce
                  merchant trust, approved assets, recipient allowlists and
                  spending controls.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    "Trusted merchant validation",
                    "Token and chain allowlists",
                    "Per-transaction spending limits",
                    "Daily budget and timeout checks",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[11px] font-semibold text-[#795b48]">
                      <CheckCircle2 size={15} className="text-[#bb8540]" />
                      {item}
                    </div>
                  ))}
                </div>

                <Link to={user ? "/blue-team" : "/login"} className="mt-8 inline-flex items-center gap-2 text-[11px] font-black text-[#b7803d]">
                  Open Blue Team <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}

      <section id="workflow" className="scroll-mt-24 px-5 py-24 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12 max-w-[650px]">
            <SectionLabel>THE PAYMENT SECURITY FLOW</SectionLabel>
            <h2 className="font-['Space_Grotesk'] text-[35px] font-bold tracking-[-1.2px] text-[#423127] sm:text-[43px]">
              From HTTP 402 to <span className="text-[#e56843]">safe settlement.</span>
            </h2>
            <p className="mt-4 text-[13px] leading-7 text-[#958575]">
              The payment challenge is inspected before the agent signs.
              A successful request can then be settled through the x402
              facilitator.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Network,
                title: "01 · Receive",
                subtitle: "x402 challenge",
                body: "The agent requests a paid resource and receives a payment requirement.",
              },
              {
                icon: ShieldCheck,
                title: "02 · Inspect",
                subtitle: "Blue Team guard",
                body: "Validate merchant, amount, network, token, recipient and spending limits.",
              },
              {
                icon: Crosshair,
                title: "03 · Evaluate",
                subtitle: "Red Team testing",
                body: "Challenge the guard with malicious payment scenarios and verify its decisions.",
              },
              {
                icon: CheckCircle2,
                title: "04 · Settle",
                subtitle: "x402 facilitator",
                body: "An approved payment is signed and submitted for facilitator settlement.",
              },
            ].map(({ icon: Icon, title, subtitle, body }) => (
              <article key={title} className="rounded-2xl border border-[#eee3d7] bg-[#fffefa] p-6 shadow-[0_5px_18px_#49362908]">
                <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#ffeadb] text-[#d8613e]">
                  <Icon size={23} />
                </div>
                <div className="mt-7 text-[9px] font-black tracking-widest text-[#bd8765]">
                  {title}
                </div>
                <h3 className="mt-2 font-['Space_Grotesk'] text-[17px] font-bold text-[#4a382b]">
                  {subtitle}
                </h3>
                <p className="mt-3 text-[11px] leading-7 text-[#968474]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* EVALUATOR */}

      <section className="px-5 pb-24 lg:px-10">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[24px] bg-[#49362c] px-7 py-12 text-white sm:px-12 sm:py-14">
          <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full border border-white/15 shadow-[0_0_0_35px_#ffffff08,0_0_0_70px_#ffffff05]" />

          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-5 text-[9px] font-black tracking-[1.7px] text-[#ffd477]">
                INTER-TEAM SECURITY EVALUATION
              </div>

              <h2 className="max-w-[700px] font-['Space_Grotesk'] text-[34px] font-bold leading-tight tracking-[-1px] sm:text-[42px]">
                Think your guard is strong?
                <br />
                <span className="text-[#ffc782]">Put it to the test.</span>
              </h2>

              <p className="mt-4 max-w-[600px] text-[12px] leading-7 text-[#e7d6c9]">
                Evaluate another team's compatible x402 Red/Blue guard
                using a common adversarial test suite. Compare decisions,
                detection and false positives.
              </p>
            </div>

            <Link
              to={user ? "/evaluator" : "/login"}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#ffe5b7] px-6 py-4 text-[11px] font-black text-[#62412c] shadow-xl transition hover:-translate-y-1 hover:bg-[#fff0d3]"
            >
              Open Evaluator <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* SDG IMPACT */}

      <section id="impact" className="scroll-mt-24 bg-[#f0e6d9] px-5 py-24 lg:px-10">
        <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[.45fr_1fr] md:items-center">
          <div className="mx-auto grid h-48 w-48 place-items-center rounded-full border-[12px] border-[#f8f4ec] bg-[#c34e37] text-center text-white shadow-2xl">
            <div>
              <Globe2 size={43} className="mx-auto mb-2 text-[#ffe5a7]" />
              <strong className="block font-['Space_Grotesk'] text-[28px]">16.4</strong>
              <span className="text-[9px] font-black tracking-widest">SDG TARGET</span>
            </div>
          </div>

          <div>
            <SectionLabel>WHY THIS MATTERS</SectionLabel>
            <h2 className="font-['Space_Grotesk'] text-[35px] font-bold tracking-[-1px] text-[#423127]">
              Financial security is a part of <span className="text-[#d75e3b]">digital trust.</span>
            </h2>

            <p className="mt-5 text-[13px] leading-8 text-[#887768]">
              SDG Target 16.4 calls for reducing illicit financial flows
              and combating organized crime. As autonomous agents become
              able to move digital value, clear authorization policies,
              trusted recipients and verifiable settlement evidence become
              important safeguards.
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#e9d7c4] bg-[#fffaf2] p-4">
              <LockKeyhole size={20} className="mt-0.5 flex-shrink-0 text-[#c76a44]" />
              <p className="text-[11px] leading-6 text-[#8c7561]">
                Sentinel 402 focuses on wallet-level payment controls and
                security evaluation for x402 agent payments. It is a
                prototype contributing to this goal, not a complete
                solution to illicit financial flows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="bg-[#352820] px-5 py-10 text-white lg:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <Brand />
            <p className="mt-4 max-w-[350px] text-[10px] leading-6 text-[#d7c6b5]">
              Protecting autonomous payments through pre-signing guard
              policies and adversarial evaluation.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-7 gap-y-3 text-[10px] font-bold text-[#f0d7c5]">
            <Link to="/dashboard" className="hover:text-[#ffd477]">Dashboard</Link>
            <Link to="/evaluator" className="hover:text-[#ffd477]">Evaluator</Link>
            <Link to="/payments" className="hover:text-[#ffd477]">Payments</Link>
            <Link to="/login" className="hover:text-[#ffd477]">Sign in</Link>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-[1200px] flex-col justify-between gap-3 border-t border-white/15 pt-6 text-[9px] font-bold tracking-wider text-[#bba897] sm:flex-row">
          <span>© 2026 SENTINEL 402 · BIOS HACKATHON</span>
          <span>x402 RED / BLUE · SDG 16.4</span>
        </div>
      </footer>

      <style>{`
        @keyframes floatShield {
          0%, 100% { transform: translateY(0) rotateY(-16deg) rotateX(9deg); }
          50% { transform: translateY(-15px) rotateY(14deg) rotateX(-4deg); }
        }
        @keyframes floatCard {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -9px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </main>
  );
}
