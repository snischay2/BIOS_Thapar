
import { Bell, Menu, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const titles = {
  "/dashboard": ["Command Center", "Your wallet security at a glance"],
  "/red-team": ["Red Team", "Adversarial attack simulation"],
  "/blue-team": ["Blue Team", "Payment protection and policies"],
  "/activity": ["Activity", "Your security audit trail"],
  "/settings": ["Settings", "Account and environment preferences"],
};

export default function Topbar({ onMenu }) {
  const { user } = useAuth();
  const location = useLocation();
  const [title, subtitle] = titles[location.pathname] || titles["/dashboard"];

  return (
    <header className="topbar">
      <div className="flex items-center gap-3 min-w-0">
        <button className="menu-button" onClick={onMenu}>
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <div className="topbar-breadcrumb">TXFORT / <span>{title.toUpperCase()}</span></div>
          <h1>{title}</h1>
          <p className="topbar-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="network-chip">
          <span className="engine-dot" />
          Base Sepolia
        </div>
        <button className="topbar-icon" title="Search">
          <Search size={19} />
        </button>
        <button className="topbar-icon notification-icon" title="Notifications">
          <Bell size={19} /><i />
        </button>
        <div className="topbar-user">
          {user?.name?.charAt(0)?.toUpperCase() || "S"}
        </div>
      </div>
    </header>
  );
}
