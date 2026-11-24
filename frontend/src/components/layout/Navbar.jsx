import { useState } from "react";

import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Command,
  X,
  CheckCheck,
  Database,
  BrainCircuit,
  ShieldCheck,
} from "lucide-react";

// =========================================
// NAVBAR COMPONENT
// =========================================

function Navbar({ isDarkMode, onToggleTheme }) {
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // =========================================
  // SAMPLE NOTIFICATIONS
  // =========================================

  const notifications = [
    {
      id: 1,
      title: "Dataset uploaded",
      message: "Sales dataset uploaded successfully.",
      time: "5 minutes ago",
      icon: Database,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      id: 2,
      title: "Analysis completed",
      message: "Your business analytics report is ready.",
      time: "20 minutes ago",
      icon: BrainCircuit,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      id: 3,
      title: "Data quality alert",
      message: "Missing values detected in your dataset.",
      time: "1 hour ago",
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  // =========================================
  // THEME STYLES
  // =========================================

  const styles = {
    header: {
      background: "var(--color-background)",
      borderColor: "var(--color-border)",
    },

    input: {
      background: "var(--color-card)",
      borderColor: "var(--color-border)",
      color: "var(--color-text)",
    },

    dropdown: {
      background: "var(--color-surface)",
      borderColor: "var(--color-border)",
      color: "var(--color-text)",
      boxShadow: "var(--shadow-card)",
    },

    heading: {
      color: "var(--color-text)",
    },

    muted: {
      color: "var(--color-muted)",
    },

    divider: {
      borderColor: "var(--color-border)",
    },
  };

  // =========================================
  // CLOSE DROPDOWNS
  // =========================================

  const closeDropdowns = () => {
    setShowProfile(false);
    setShowNotifications(false);
  };

  // =========================================
  // RENDER NAVBAR
  // =========================================

  return (
    <header
      style={styles.header}
      className="sticky top-0 z-40 flex h-[88px] shrink-0 items-center justify-between border-b px-4 transition-colors duration-300 sm:px-6 md:px-8"
    >
      {/* =====================================
          LEFT SECTION - SEARCH
      ===================================== */}

      <div className="flex min-w-0 flex-1 items-center">

        <div
          className="relative flex w-full max-w-[530px] items-center rounded-2xl border transition-all duration-200 focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/10"
          style={styles.input}
        >

          <Search
            size={20}
            className="ml-4 shrink-0"
            style={styles.muted}
          />

          <input
            type="text"
            placeholder="Search datasets, reports, analytics..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 w-full min-w-0 bg-transparent px-3 text-sm outline-none placeholder:text-slate-500"
            style={{ color: "var(--color-text)" }}
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="mr-2 rounded-md p-1 transition hover:bg-cyan-500/10 hover:text-cyan-400"
              style={styles.muted}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}

          {/* KEYBOARD SHORTCUT */}

          <div
            className="mr-3 hidden shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs sm:flex"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-muted)",
            }}
          >
            <Command size={12} />
            <span>K</span>
          </div>

        </div>

      </div>

      {/* =====================================
          RIGHT SECTION
      ===================================== */}

      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-4 md:gap-5">

        {/* =================================
            THEME TOGGLE
        ================================= */}

        <button
          onClick={onToggleTheme}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-xl transition duration-200 hover:bg-cyan-500/10 hover:text-cyan-400"
          style={styles.muted}
        >
          {isDarkMode ? (
            <Sun size={21} />
          ) : (
            <Moon size={21} />
          )}
        </button>

        {/* =================================
            NOTIFICATIONS
        ================================= */}

        <div className="relative">

          <button
            onClick={() => {
              setShowNotifications((previous) => !previous);
              setShowProfile(false);
            }}
            title="Notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-cyan-500/10 hover:text-cyan-400"
            style={styles.muted}
          >
            <Bell size={21} />

            {/* Notification Indicator */}

            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-background)] bg-blue-500" />
          </button>

          {/* NOTIFICATION DROPDOWN */}

          {showNotifications && (
            <div
              style={styles.dropdown}
              className="absolute right-0 top-14 z-50 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border shadow-2xl sm:w-[360px]"
            >

              <div
                className="flex items-center justify-between border-b p-4"
                style={styles.divider}
              >

                <div>
                  <h3 className="font-semibold" style={styles.heading}>
                    Notifications
                  </h3>

                  <p className="mt-1 text-xs" style={styles.muted}>
                    Your latest workspace updates
                  </p>
                </div>

                <button
                  onClick={() => setShowNotifications(false)}
                  className="rounded-lg p-2 transition hover:bg-cyan-500/10"
                  style={styles.muted}
                  title="Close notifications"
                >
                  <X size={17} />
                </button>

              </div>

              <div className="max-h-[350px] overflow-y-auto">

                {notifications.map((notification) => {

                  const Icon = notification.icon;

                  return (
                    <div
                      key={notification.id}
                      className="flex gap-3 border-b p-4 transition hover:bg-cyan-500/5"
                      style={styles.divider}
                    >

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.bg}`}
                      >
                        <Icon
                          size={19}
                          className={notification.color}
                        />
                      </div>

                      <div className="min-w-0 flex-1">

                        <h4
                          className="text-sm font-semibold"
                          style={styles.heading}
                        >
                          {notification.title}
                        </h4>

                        <p
                          className="mt-1 text-xs leading-relaxed"
                          style={styles.muted}
                        >
                          {notification.message}
                        </p>

                        <p
                          className="mt-2 text-[10px]"
                          style={styles.muted}
                        >
                          {notification.time}
                        </p>

                      </div>

                    </div>
                  );
                })}

              </div>

              <button
                onClick={() => setShowNotifications(false)}
                className="flex w-full items-center justify-center gap-2 p-3 text-xs font-semibold text-cyan-500 transition hover:bg-cyan-500/5"
              >
                <CheckCheck size={15} />
                Close notifications
              </button>

            </div>
          )}

        </div>

        {/* VERTICAL DIVIDER */}

        <div
          className="hidden h-10 border-l sm:block"
          style={styles.divider}
        />

        {/* =================================
            USER PROFILE
        ================================= */}

        <div className="relative">

          <button
            onClick={() => {
              setShowProfile((previous) => !previous);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 rounded-xl px-1 py-2 transition hover:bg-cyan-500/5 sm:px-2"
          >

            {/* AVATAR */}

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-base font-bold text-white shadow-lg shadow-blue-500/20">
              V
            </div>

            {/* PROFILE DETAILS */}

            <div className="hidden text-left sm:block">

              <p
                className="text-sm font-bold"
                style={styles.heading}
              >
                Venkat
              </p>

              <p
                className="text-xs"
                style={styles.muted}
              >
                Analyst
              </p>

            </div>

            <ChevronDown
              size={16}
              className={`hidden transition-transform duration-200 sm:block ${
                showProfile ? "rotate-180" : ""
              }`}
              style={styles.muted}
            />

          </button>

          {/* PROFILE DROPDOWN */}

          {showProfile && (
            <div
              style={styles.dropdown}
              className="absolute right-0 top-14 z-50 w-60 overflow-hidden rounded-2xl border p-2 shadow-2xl"
            >

              {/* PROFILE HEADER */}

              <div
                className="border-b px-3 py-3"
                style={styles.divider}
              >

                <p
                  className="text-sm font-bold"
                  style={styles.heading}
                >
                  Venkat
                </p>

                <p
                  className="mt-1 text-xs"
                  style={styles.muted}
                >
                  Data Copilot Analyst
                </p>

              </div>

              {/* PROFILE OPTIONS */}

              <button
                onClick={closeDropdowns}
                className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition hover:bg-cyan-500/10 hover:text-cyan-400"
                style={styles.heading}
              >
                <User size={17} />
                My Profile
              </button>

              <button
                onClick={closeDropdowns}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition hover:bg-cyan-500/10 hover:text-cyan-400"
                style={styles.heading}
              >
                <Settings size={17} />
                Account Settings
              </button>

              <div
                className="my-2 border-t"
                style={styles.divider}
              />

              <button
                onClick={closeDropdowns}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut size={17} />
                Sign Out
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default Navbar;