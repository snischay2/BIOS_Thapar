
import { ShieldCheck, CheckCircle2, Zap } from "lucide-react";

export default function SecurityOrb() {
  return (
    <div className="security-orb-scene">
      <div className="orb-ring orb-ring-1" />
      <div className="orb-ring orb-ring-2" />
      <div className="orb-ring orb-ring-3" />

      <div className="orb-core">
        <div className="orb-highlight" />
        <div className="orb-shield">
          <ShieldCheck size={91} strokeWidth={1.45} />
        </div>
        <div className="orb-base" />
      </div>

      <div className="orb-tag orb-tag-top">
        <span className="engine-dot" />
        GUARD ACTIVE
      </div>

      <div className="orb-tag orb-tag-bottom">
        <CheckCircle2 size={16} />
        THREATS BLOCKED
      </div>

      <div className="orb-tag orb-tag-side">
        <Zap size={14} />
        x402
      </div>

      <i className="orb-particle p1" />
      <i className="orb-particle p2" />
      <i className="orb-particle p3" />
      <i className="orb-particle p4" />
    </div>
  );
}
