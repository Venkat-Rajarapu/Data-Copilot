import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import { useAuth } from "../../context/AuthContext";

import {
  LogOut,
  UserCircle,
  ShieldCheck,
} from "lucide-react";

const DashboardLayout = ({
  children,
  activePage = "Dashboard",
  onNavigate,
}) => {
  const { user, role, logout } = useAuth();

  const navigate = useNavigate();

  // Theme management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("data-copilot-theme");

    return savedTheme ? savedTheme === "dark" : true;
  });

  // Apply theme
  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", theme);

    localStorage.setItem("data-copilot-theme", theme);
  }, [isDarkMode]);

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode((previousMode) => !previousMode);
  };

  // Logout
  const handleLogout = () => {
    logout();

    navigate("/login", { replace: true });
  };

  // Navigation
  const handleNavigation = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // Role badge styling
  const getRoleStyle = () => {
    switch (role) {
      case "admin":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";

      case "analyst":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";

      case "viewer":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div
      data-theme={isDarkMode ? "dark" : "light"}
      className="flex min-h-screen w-full bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-300"
    >

      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigation}
      />

      {/* Main Application */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Navbar */}
        <Navbar
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        {/* User Information Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">

          {/* User Profile */}
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <UserCircle size={24} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                Welcome, {user?.full_name || "User"}
              </h3>

              <p className="text-xs text-[var(--color-muted)]">
                {user?.email}
              </p>
            </div>

          </div>

          {/* Role and Logout */}
          <div className="flex items-center gap-3">

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold capitalize ${getRoleStyle()}`}
            >
              <ShieldCheck size={14} />
              {role || "User"}
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              <LogOut size={16} />

              <span>Logout</span>
            </button>

          </div>

        </div>

        {/* Main Content */}
        <main className="min-h-[calc(100vh-160px)] flex-1 p-4 sm:p-5 md:p-8">

          {children}

        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--color-border)] px-5 py-5 text-center text-xs text-[var(--color-muted)]">

          <p>
            © {new Date().getFullYear()} Data Copilot.
            All rights reserved.
          </p>

          <p className="mt-1">
            AI-Powered Business Analytics & Decision Intelligence Platform
          </p>

        </footer>

      </div>

    </div>
  );
};

export default DashboardLayout;