
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="main-panel">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <div className="page-container">
          <Outlet />
        </div>
        <footer className="app-footer">
          <span>© 2026 TXFORT</span>
          <span>Autonomous payment protection · SDG 16.4</span>
          <span>TESTNET ENVIRONMENT</span>
        </footer>
      </main>
    </div>
  );
}
