import { useState } from "react";

import {
  LayoutDashboard,
  Database,
  ShieldCheck,
  Workflow,
  BrainCircuit,
  Bot,
  FileText,
  Layers,
  Settings,
  CircleHelp,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  LogOut,
  BriefcaseBusiness,
} from "lucide-react";

// =========================================
// NAVIGATION CONFIGURATION
// =========================================

const navigationItems = [
  {
    title: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },

  {
  title: "DATA MANAGEMENT",
  items: [
    { name: "Datasets", icon: Database },
    { name: "Data Quality", icon: ShieldCheck },
    { name: "Data Cleaning", icon: Sparkles },
    { name: "Data Processing", icon: Workflow },
  ],
},

  {
    title: "INTELLIGENCE",
    items: [
      {
        name: "Predictive Analytics",
        icon: BrainCircuit,
      },
      {
        name: "AI Business Analyst",
        icon: Bot,
      },
      {
        name: "Reports",
        icon: FileText,
      },
    ],
  },

  {
    title: "WORKSPACE",
    items: [
      {
        name: "Workspaces",
        icon: Layers,
      },
    ],
  },
];

// =========================================
// SIDEBAR COMPONENT
// =========================================

function Sidebar({
  activePage,
  onNavigate,
  user,
  role,
  onLogout,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const userName =
    user?.full_name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const userRole = role || "User";

  const avatarLetter = userName.charAt(0).toUpperCase();

  // Theme-aware colors

  const sidebarStyle = {
    background: "var(--gradient-sidebar)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  const mutedText = {
    color: "var(--color-muted)",
  };

  const activeItemStyle = {
    background: "rgba(6, 182, 212, 0.13)",
    color: "#22d3ee",
    border: "1px solid rgba(6, 182, 212, 0.18)",
    boxShadow: "0 4px 15px rgba(6, 182, 212, 0.06)",
  };

  const inactiveItemStyle = {
    color: "var(--color-text-secondary)",
  };

  return (
    <aside
      style={sidebarStyle}
      className={`sticky top-0 z-50 flex h-screen shrink-0 flex-col border-r transition-all duration-300 ${
        collapsed ? "w-20" : "w-[260px]"
      }`}
    >

      {/* BRAND SECTION */}

      <div
        className="flex h-[88px] shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: "var(--color-border)" }}
      >

        <div className="flex min-w-0 items-center gap-3">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 text-white shadow-lg shadow-cyan-500/20">
            <Sparkles size={25} strokeWidth={2.2} />
          </div>

          {!collapsed && (
            <div className="min-w-0">

              <h1 className="whitespace-nowrap text-lg font-extrabold tracking-tight">
                Data{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Copilot
                </span>
              </h1>

              <p
                className="mt-0.5 text-[10px] font-medium tracking-[0.15em]"
                style={mutedText}
              >
                INTELLIGENCE PLATFORM
              </p>

            </div>
          )}

        </div>

        {/* COLLAPSE BUTTON */}

        <button
          type="button"
          onClick={() => setCollapsed((previous) => !previous)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-lg p-2 transition hover:bg-cyan-500/10 hover:text-cyan-400"
          style={mutedText}
        >
          {collapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
        </button>

      </div>

      {/* WORKSPACE SELECTOR */}

      <div className="shrink-0 px-4 py-5">

        <button
          type="button"
          onClick={() => onNavigate("Workspaces")}
          title={collapsed ? "My Workspace" : ""}
          className="flex w-full items-center justify-between rounded-2xl border p-3 text-left transition duration-300 hover:border-cyan-500/30 hover:bg-cyan-500/5"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
              <BriefcaseBusiness size={18} />
            </div>

            {!collapsed && (
              <div className="min-w-0">

                <p
                  className="text-[10px] font-medium tracking-wider"
                  style={mutedText}
                >
                  CURRENT WORKSPACE
                </p>

                <p className="mt-1 truncate text-sm font-semibold">
                  My Workspace
                </p>

              </div>
            )}

          </div>

          {!collapsed && (
            <ChevronRight
              size={17}
              style={mutedText}
            />
          )}

        </button>

      </div>

      {/* NAVIGATION MENU */}

      <nav className="custom-sidebar-scrollbar flex-1 space-y-7 overflow-y-auto px-3 pb-5">

        {navigationItems.map((section) => (

          <div key={section.title}>

            {!collapsed && (
              <p
                className="mb-3 px-3 text-[10px] font-bold tracking-[0.15em]"
                style={mutedText}
              >
                {section.title}
              </p>
            )}

            <div className="space-y-1.5">

              {section.items.map((item) => {

                const Icon = item.icon;

                const isActive = activePage === item.name;

                return (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => onNavigate(item.name)}
                    title={collapsed ? item.name : ""}
                    style={
                      isActive
                        ? activeItemStyle
                        : inactiveItemStyle
                    }
                    className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? "font-semibold"
                        : "hover:bg-cyan-500/5 hover:text-cyan-400"
                    }`}
                  >

                    {/* ACTIVE INDICATOR */}

                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-cyan-400" />
                    )}

                    {/* ICON */}

                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.3 : 1.8}
                      className={`shrink-0 transition-transform duration-200 ${
                        isActive
                          ? "text-cyan-400"
                          : "group-hover:scale-110"
                      }`}
                    />

                    {/* LABEL */}

                    {!collapsed && (
                      <span className="truncate">
                        {item.name}
                      </span>
                    )}

                    {/* ACTIVE DOT */}

                    {!collapsed && isActive && (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                    )}

                  </button>
                );
              })}

            </div>

          </div>
        ))}

      </nav>

      {/* BOTTOM SECTION */}

      <div
        className="shrink-0 space-y-1 border-t p-3"
        style={{ borderColor: "var(--color-border)" }}
      >

        {/* HELP & SUPPORT */}

        <button
          type="button"
          title={collapsed ? "Help & Support" : ""}
          onClick={() => onNavigate("Help & Support")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition hover:bg-cyan-500/5 hover:text-cyan-400"
          style={mutedText}
        >
          <CircleHelp size={20} strokeWidth={1.8} />

          {!collapsed && <span>Help & Support</span>}
        </button>

        {/* SETTINGS */}

        <button
          type="button"
          title={collapsed ? "Settings" : ""}
          onClick={() => onNavigate("Settings")}
          style={
            activePage === "Settings"
              ? activeItemStyle
              : inactiveItemStyle
          }
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition hover:bg-cyan-500/5 hover:text-cyan-400"
        >
          <Settings size={20} strokeWidth={1.8} />

          {!collapsed && <span>Settings</span>}
        </button>

        {/* USER PROFILE */}

        <div
          className="mt-3 flex items-center gap-3 border-t px-2 pt-4"
          style={{ borderColor: "var(--color-border)" }}
        >

          {/* AVATAR */}

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
            {avatarLetter}
          </div>

          {!collapsed && (
            <>

              {/* USER DETAILS */}

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-bold">
                  {userName}
                </p>

                <p
                  className="mt-0.5 text-xs capitalize"
                  style={mutedText}
                >
                  {userRole}
                </p>

              </div>

              {/* LOGOUT */}

              <button
                type="button"
                title="Logout"
                onClick={onLogout}
                className="rounded-lg p-2 transition hover:bg-red-500/10 hover:text-red-400"
                style={mutedText}
              >
                <LogOut size={18} />
              </button>

            </>
          )}

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;