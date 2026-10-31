
import { ShieldCheck, Sparkles } from "lucide-react";

export default function PlaceholderPage({ title }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon"><ShieldCheck size={40} /></div>
      <div className="eyebrow">SENTINEL SECURITY MODULE</div>
      <h2>{title}</h2>
      <p>This module is being connected to the Sentinel security engine.</p>
      <span><Sparkles size={15} /> Module setup in progress</span>
    </div>
  );
}
