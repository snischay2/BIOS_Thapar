
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import {
  Crosshair,
  Globe2,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { useAuth } from "./context/AuthContext";

import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import RedTeam from "./pages/RedTeam";
import BlueTeam from "./pages/BlueTeam";
import Evaluator from "./pages/Evaluator";
import Payments from "./pages/Payments";
import ActivityPage from "./pages/Activity";
import SettingsPage from "./pages/Settings";

import "./pages/TeamPages.css";
import "./pages/PaymentPage.css";

function LoadingScreen() {
  return (
    <div className="app-loader">
      <div className="loader-mark">
        <ShieldCheck size={29} />
      </div>
      <div className="loader-spinner" />
      <p>Preparing your security workspace...</p>
    </div>
  );
}

function PublicRoute({ mode }) {
  const { user, initializing } = useAuth();

  if (initializing) return <LoadingScreen />;

  return user
    ? <Navigate to="/dashboard" replace />
    : <AuthPage mode={mode} />;
}

function ProtectedRoute() {
  const { user, initializing } = useAuth();

  if (initializing) return <LoadingScreen />;

  return user
    ? <Outlet />
    : <Navigate to="/login" replace />;
}

function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Red Team", path: "/red-team", icon: Crosshair },
    { label: "Blue Team", path: "/blue-team", icon: ShieldCheck },
    { label: "Evaluator", path: "/evaluator", icon: Globe2 },
    { label: "Payments", path: "/payments", icon: Wallet },
    { label: "Activity", path: "/activity", icon: History },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="dashboard-layout">
      <aside className="dash-sidebar">
        <NavLink to="/" className="dash-brand">
          <div className="dash-brand-icon">
            <ShieldCheck size={23} />
          </div>
          <div>
            <strong>SENTINEL <span>402</span></strong>
            <small>PAYMENT SECURITY</small>
          </div>
        </NavLink>

        <div className="dash-workspace">
          <div className="workspace-avatar">S</div>
          <div>
            <strong>Sentinel Workspace</strong>
            <small>Base Sepolia · Testnet</small>
          </div>
          <span className="workspace-dot" />
        </div>

        <div className="dash-nav-label">SECURITY CONSOLE</div>

        <nav className="dash-nav">
          {links.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/dashboard"}
              className={({ isActive }) =>
                `dash-nav-link ${isActive ? "dash-nav-active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Evaluator" && <i className="nav-alert-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="dash-sidebar-bottom">
          <div className="dash-network-card">
            <div className="network-icon">
              <Wallet size={18} />
            </div>
            <div>
              <strong>Base Sepolia</strong>
              <small>Test network</small>
            </div>
            <span className="workspace-dot" />
          </div>

          <div className="dash-profile">
            <div className="dash-avatar">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>

            <div className="dash-profile-info">
              <strong>{user?.name || "Sentinel User"}</strong>
              <small>{user?.email}</small>
            </div>

            <button
              className="dash-logout"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-topbar">
          <div>
            <div className="dash-breadcrumb">
              SENTINEL <span>/</span> SECURITY WORKSPACE
            </div>
            <h1>Payment Security Console</h1>
          </div>

          <div className="dash-topbar-right">
            <div className="dash-network-pill">
              <span className="workspace-dot" />
              BASE SEPOLIA
            </div>

            <div className="dash-top-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <Outlet />

        <footer className="dash-footer">
          <span>© 2026 SENTINEL 402</span>
          <span>BUILT FOR x402 · BIOS HACKATHON</span>
          <span>SDG 16.4</span>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<PublicRoute mode="login" />} />
      <Route path="/register" element={<PublicRoute mode="register" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<WorkspaceLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/red-team" element={<RedTeam />} />
          <Route path="/blue-team" element={<BlueTeam />} />
          <Route path="/evaluator" element={<Evaluator />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
