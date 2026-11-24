import { useEffect, useMemo, useState } from "react";

import {

  Users,

  Database,

  ShieldCheck,

  Activity,

  Settings,

  ArrowUpRight,

  Server,

  Clock,

  CheckCircle2,

  AlertCircle,

  RefreshCw,

  BrainCircuit,

  BarChart3,

  Sparkles,

  Search,

  Plus,

  Filter,

  MoreHorizontal,

  Mail,

  Shield,

  UserCheck,

  UserX,

  Trash2,

  X,

  Download,

  FileSpreadsheet,

  FileText,

  UploadCloud,

  HardDrive,

  CalendarDays,

  Eye,

  Clock3,

  CircleCheck,

  File,

} from "lucide-react";

import DatasetPanel from "../components/DatasetPanel";

import SystemMonitoring from "./SystemMonitoring";
import {
  getAllUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "../../../api/adminApi";

/* =========================================

   THEME CSS (embedded, no separate .css file)

   Same look as the login page: dark navy,

   cyan glow, glassmorphism.

========================================= */



const STYLES = `

@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');



.dc-admin {

  --dc-cyan: #19d3ff;

  --dc-cyan-strong: #00c8ff;

  --dc-teal: #19e6c1;

  --dc-blue: #0ab4ff;

  --dc-navy: #04152b;

  --dc-navy-deep: #020a1a;

  --dc-muted: #9fb3c8;

  --dc-text: #ffffff;

  --dc-glass: rgba(8, 25, 45, 0.65);

  --dc-border: rgba(0, 212, 255, 0.28);



  position: relative;

  isolation: isolate;

  min-height: 100%;

  padding: 28px;

  border-radius: 24px;

  color: var(--dc-text);

  font-family: 'Poppins', 'Inter', system-ui, sans-serif;

  background:

    radial-gradient(ellipse 40% 35% at 0% 0%, rgba(0, 200, 255, 0.2), transparent 70%),

    radial-gradient(ellipse 40% 40% at 100% 20%, rgba(25, 230, 193, 0.14), transparent 70%),

    radial-gradient(ellipse 60% 25% at 50% 100%, rgba(0, 200, 255, 0.18), transparent 70%),

    linear-gradient(180deg, #04152b 0%, #020a1a 100%);

  overflow: hidden;

}

.dc-admin::before {

  content: '';

  position: absolute;

  inset: 0;

  z-index: -1;

  pointer-events: none;

  background-image:

    linear-gradient(rgba(25, 211, 255, 0.045) 1px, transparent 1px),

    linear-gradient(90deg, rgba(25, 211, 255, 0.045) 1px, transparent 1px);

  background-size: 44px 44px;

  mask-image: radial-gradient(ellipse at 50% 20%, #000 20%, transparent 75%);

  -webkit-mask-image: radial-gradient(ellipse at 50% 20%, #000 20%, transparent 75%);

}



/* Header */

.dc-gradient-text {

  background: linear-gradient(90deg, var(--dc-cyan-strong), var(--dc-teal));

  -webkit-background-clip: text;

  background-clip: text;

  color: transparent;

}

.dc-underline {

  width: 56px;

  height: 3px;

  border-radius: 3px;

  background: var(--dc-cyan);

  box-shadow: 0 0 12px var(--dc-cyan), 0 0 24px rgba(25, 211, 255, 0.6);

}

.dc-glow-icon {

  color: var(--dc-cyan);

  filter: drop-shadow(0 0 8px rgba(25, 211, 255, 0.85));

}



/* Glass surfaces */

.dc-glass {

  position: relative;

  background: var(--dc-glass);

  -webkit-backdrop-filter: blur(18px);

  backdrop-filter: blur(18px);

  border: 1px solid var(--dc-border);

  border-radius: 20px;

  box-shadow: 0 0 28px rgba(0, 212, 255, 0.16), inset 0 0 24px rgba(0, 212, 255, 0.06);

}

.dc-glass-hover {

  transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;

}

.dc-glass-hover:hover {

  transform: translateY(-4px);

  border-color: rgba(25, 211, 255, 0.7);

  box-shadow: 0 0 34px rgba(0, 212, 255, 0.32), inset 0 0 24px rgba(0, 212, 255, 0.08);

}

.dc-glass-line::after {

  content: '';

  position: absolute;

  left: 18%;

  right: 18%;

  bottom: -1px;

  height: 2px;

  background: linear-gradient(90deg, transparent, var(--dc-cyan), transparent);

  box-shadow: 0 0 12px var(--dc-cyan);

}



/* Icon chips */

.dc-chip {

  display: inline-flex;

  padding: 12px;

  border-radius: 14px;

  border: 1px solid;

}

.dc-chip-cyan { color: #19d3ff; background: rgba(25, 211, 255, 0.1); border-color: rgba(25, 211, 255, 0.35); box-shadow: 0 0 16px rgba(25, 211, 255, 0.2); }

.dc-chip-blue { color: #5aa9ff; background: rgba(90, 169, 255, 0.1); border-color: rgba(90, 169, 255, 0.35); box-shadow: 0 0 16px rgba(90, 169, 255, 0.2); }

.dc-chip-teal { color: #19e6c1; background: rgba(25, 230, 193, 0.1); border-color: rgba(25, 230, 193, 0.35); box-shadow: 0 0 16px rgba(25, 230, 193, 0.2); }

.dc-chip-purple { color: #b39bff; background: rgba(167, 139, 250, 0.1); border-color: rgba(167, 139, 250, 0.35); box-shadow: 0 0 16px rgba(167, 139, 250, 0.2); }



/* Tabs and buttons */

.dc-tab {

  padding: 9px 18px;

  font-size: 14px;

  font-weight: 500;

  color: var(--dc-muted);

  background: rgba(255, 255, 255, 0.04);

  border: 1px solid rgba(255, 255, 255, 0.12);

  border-radius: 12px;

  cursor: pointer;

  transition: color 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s;

}

.dc-tab:hover {

  color: #fff;

  border-color: var(--dc-cyan);

  transform: translateY(-1px);

}

.dc-tab-active {

  color: var(--dc-navy);

  font-weight: 700;

  background: linear-gradient(90deg, var(--dc-blue), var(--dc-teal));

  border-color: transparent;

  box-shadow: 0 0 22px rgba(0, 212, 255, 0.45);

}

.dc-tab-active:hover { color: var(--dc-navy); }



.dc-btn {

  display: inline-flex;

  align-items: center;

  gap: 8px;

  padding: 9px 16px;

  font-size: 13px;

  font-weight: 500;

  color: #fff;

  background: rgba(255, 255, 255, 0.04);

  border: 1px solid rgba(255, 255, 255, 0.15);

  border-radius: 12px;

  cursor: pointer;

  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;

}

.dc-btn:hover {

  border-color: var(--dc-cyan);

  box-shadow: 0 0 18px rgba(25, 211, 255, 0.35);

  transform: translateY(-2px);

}

.dc-tab:focus-visible,

.dc-btn:focus-visible,

.dc-action:focus-visible {

  outline: 2px solid #fff;

  outline-offset: 3px;

}

.dc-spin { animation: dc-spin 0.8s linear infinite; }



/* Status */

.dc-dot {

  width: 9px;

  height: 9px;

  border-radius: 50%;

  background: var(--dc-muted);

}

.dc-dot-online { background: var(--dc-teal); box-shadow: 0 0 10px var(--dc-teal); animation: dc-pulse 2s ease-in-out infinite; }

.dc-dot-offline { background: #ff6b6b; box-shadow: 0 0 10px #ff6b6b; }



/* KPI card accent line */

.dc-kpi-line {

  height: 3px;

  border-radius: 3px;

  background: linear-gradient(90deg, var(--dc-cyan), transparent);

  box-shadow: 0 0 10px rgba(25, 211, 255, 0.5);

  opacity: 0.8;

}



/* Role ring */

.dc-ring-track { fill: none; stroke: rgba(25, 211, 255, 0.14); stroke-width: 9; }

.dc-ring-seg { fill: none; stroke-width: 9; stroke-linecap: butt; filter: drop-shadow(0 0 5px currentColor); }



/* Feature pill */

.dc-feature-bar {

  display: inline-flex;

  flex-wrap: wrap;

  justify-content: center;

  align-items: center;

  padding: 10px 14px;

  background: rgba(6, 20, 38, 0.8);

  border: 1px solid rgba(25, 211, 255, 0.3);

  border-radius: 20px;

}

.dc-feature-item {

  display: flex;

  align-items: center;

  gap: 10px;

  padding: 6px 24px;

  font-size: 14px;

  font-weight: 500;

}

.dc-feature-item svg { color: var(--dc-cyan); }

.dc-feature-item + .dc-feature-item { border-left: 1px solid rgba(255, 255, 255, 0.18); }



/* Entry animation */

.dc-rise { animation: dc-rise 0.5s ease both; }



@keyframes dc-rise {

  from { opacity: 0; transform: translateY(12px); }

  to { opacity: 1; transform: translateY(0); }

}

@keyframes dc-pulse {

  0%, 100% { opacity: 1; }

  50% { opacity: 0.45; }

}

@keyframes dc-spin { to { transform: rotate(360deg); } }



@media (max-width: 640px) {

  .dc-admin { padding: 16px; border-radius: 16px; }

  .dc-feature-item { padding: 6px 12px; font-size: 12px; }

  .dc-feature-item + .dc-feature-item { border-left: 0; }

}



@media (prefers-reduced-motion: reduce) {

  .dc-admin *,

  .dc-admin *::before,

  .dc-admin *::after {

    animation: none !important;

    transition: none !important;

  }

}



/* =========================================

   LIGHT THEME OVERRIDES

========================================= */

.dc-admin-light {

  --dc-cyan: #0891b2;

  --dc-cyan-strong: #0284c7;

  --dc-teal: #0f9f8f;

  --dc-blue: #0284c7;

  --dc-navy: #eaf4fb;

  --dc-navy-deep: #f5f9fd;

  --dc-muted: #526579;

  --dc-text: #14283d;

  --dc-glass: rgba(255, 255, 255, 0.88);

  --dc-border: rgba(8, 145, 178, 0.22);

  color: var(--dc-text);

  background:

    radial-gradient(ellipse 40% 35% at 0% 0%, rgba(14, 165, 233, 0.12), transparent 70%),

    radial-gradient(ellipse 40% 40% at 100% 20%, rgba(20, 184, 166, 0.10), transparent 70%),

    radial-gradient(ellipse 60% 25% at 50% 100%, rgba(14, 165, 233, 0.09), transparent 70%),

    linear-gradient(180deg, #f7fbff 0%, #eaf2f9 100%);

}

.dc-admin-light::before {

  background-image:

    linear-gradient(rgba(8, 145, 178, 0.055) 1px, transparent 1px),

    linear-gradient(90deg, rgba(8, 145, 178, 0.055) 1px, transparent 1px);

}

.dc-admin-light .dc-glass {

  background: var(--dc-glass);

  border-color: var(--dc-border);

  box-shadow: 0 8px 28px rgba(15, 45, 70, 0.07), inset 0 0 18px rgba(8, 145, 178, 0.025);

}

.dc-admin-light .dc-glass-hover:hover {

  border-color: rgba(8, 145, 178, 0.5);

  box-shadow: 0 12px 30px rgba(15, 45, 70, 0.11);

}

.dc-admin-light .dc-tab {

  color: #526579;

  background: rgba(255, 255, 255, 0.72);

  border-color: rgba(71, 105, 130, 0.18);

}

.dc-admin-light .dc-tab:hover { color: #075985; }

.dc-admin-light .dc-tab-active {

  color: #ffffff;

  background: linear-gradient(90deg, #0284c7, #0f9f8f);

  border-color: transparent;

}

.dc-admin-light .dc-tab-active:hover { color: #ffffff; }

.dc-admin-light .dc-btn {

  color: #244258;

  background: rgba(255, 255, 255, 0.76);

  border-color: rgba(71, 105, 130, 0.2);

}

.dc-admin-light .dc-btn:hover { color: #0369a1; }

.dc-admin-light .dc-feature-bar {

  background: rgba(255, 255, 255, 0.82);

  border-color: rgba(8, 145, 178, 0.22);

  box-shadow: 0 8px 24px rgba(15, 45, 70, 0.05);

}

.dc-admin-light .dc-feature-item + .dc-feature-item {

  border-left-color: rgba(71, 105, 130, 0.2);

}

.dc-admin-light .dc-ring-track { stroke: rgba(8, 145, 178, 0.14); }



/* Neutralize dark-only Tailwind utility colors used inside the cards. */

.dc-admin-light .text-white { color: #14283d !important; }

.dc-admin-light [class*="border-white"] { border-color: rgba(71, 105, 130, 0.16) !important; }

.dc-admin-light [class*="bg-white/"] { background-color: rgba(255, 255, 255, 0.58) !important; }

.dc-admin-light .dc-chip-cyan { color: #087e9b; background: rgba(8, 145, 178, 0.09); }

.dc-admin-light .dc-chip-blue { color: #2563a8; background: rgba(37, 99, 168, 0.09); }

.dc-admin-light .dc-chip-teal { color: #0f8879; background: rgba(15, 159, 143, 0.09); }

.dc-admin-light .dc-chip-purple { color: #7656b5; background: rgba(118, 86, 181, 0.09); }



`;



/* =========================================

   STATIC CONFIG

========================================= */



const TABS = ["Overview", "Users", "Datasets", "System"];



const ROLE_META = [

  { name: "Administrators", role: "Admin", color: "#b39bff" },

  { name: "Data Analysts", role: "Analyst", color: "#19d3ff" },

  { name: "Viewers", role: "Viewer", color: "#19e6c1" },

];



const ACTIVITIES = [

  {

    title: "User Management",

    description: "Monitor new registrations and account changes.",

    icon: Users,

    chip: "dc-chip-cyan",

  },

  {

    title: "Dataset Management",

    description: "Monitor dataset uploads and processing.",

    icon: Database,

    chip: "dc-chip-blue",

  },

  {

    title: "Security Monitoring",

    description: "Monitor authentication and access events.",

    icon: ShieldCheck,

    chip: "dc-chip-teal",

  },

];



const QUICK_ACTIONS = [

  {

    title: "Manage Users",

    description: "View and manage platform accounts",

    icon: Users,

    tab: "Users",

  },

  {

    title: "Monitor Datasets",

    description: "Review uploaded datasets",

    icon: Database,

    tab: "Datasets",

  },

  {

    title: "System Settings",

    description: "Manage platform configuration",

    icon: Settings,

    tab: "System",

  },

];



/* =========================================

   HELPERS

========================================= */



// Show "—" until the backend value arrives

const show = (value) =>

  value === undefined || value === null

    ? "—"

    : typeof value === "number"

      ? value.toLocaleString()

      : value;



function statusInfo(value) {

  if (value === true || value === "online" || value === "ok") {

    return { label: "Online", dot: "dc-dot-online" };

  }

  if (value === false || value === "offline" || value === "error") {

    return { label: "Offline", dot: "dc-dot-offline" };

  }

  return { label: "Not checked", dot: "" };

}



/* =========================================

   ROLE RING (SVG donut)

========================================= */



function RoleRing({ counts }) {

  const radius = 42;

  const circumference = 2 * Math.PI * radius;



  const values = ROLE_META.map((r) => Number(counts?.[r.role]) || 0);

  const total = values.reduce((sum, v) => sum + v, 0);



  let offset = 0;



  return (

    <div className="relative mx-auto h-40 w-40">

      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">

        <circle cx="60" cy="60" r={radius} className="dc-ring-track" />

        {total > 0 &&

          ROLE_META.map((r, i) => {

            const length = (values[i] / total) * circumference;

            const segment = (

              <circle

                key={r.role}

                cx="60"

                cy="60"

                r={radius}

                className="dc-ring-seg"

                style={{ color: r.color }}

                stroke={r.color}

                strokeDasharray={`${Math.max(length - 2, 0)} ${circumference}`}

                strokeDashoffset={-offset}

              />

            );

            offset += length;

            return segment;

          })}

      </svg>



      <div className="absolute inset-0 flex flex-col items-center justify-center">

        <span className="text-2xl font-bold">{total > 0 ? total.toLocaleString() : "—"}</span>

        <span className="text-[11px] text-[var(--dc-muted)]">Total users</span>

      </div>

    </div>

  );

}





/* =========================================

   USER MANAGEMENT UI

   Frontend-only preview data. Replace with API

   data after the UI phase is complete.

========================================= */



const INITIAL_USERS = [

  { id: 1, name: "Data Copilot Admin", email: "admin@datacopilot.com", role: "Admin", status: "Active", joined: "Nov 01, 2026" },

  { id: 2, name: "Analyst Demo", email: "analyst@datacopilot.com", role: "Analyst", status: "Active", joined: "Nov 03, 2026" },

  { id: 3, name: "Viewer Demo", email: "viewer@datacopilot.com", role: "Viewer", status: "Active", joined: "Nov 04, 2026" },

  { id: 4, name: "Sample User", email: "user@datacopilot.com", role: "Viewer", status: "Inactive", joined: "Nov 05, 2026" },

];



function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "Viewer",
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);

  const getErrorMessage = (err) =>
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again.";

  const mapUser = (user) => ({
    id: user.id,
    name: user.full_name,
    email: user.email,
    role:
      Number(user.role_id) === 1
        ? "Admin"
        : Number(user.role_id) === 2
          ? "Analyst"
          : "Viewer",
    status: user.is_active ? "Active" : "Inactive",
    joined: user.created_at
      ? new Date(user.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      : "—",
  });

  const fetchUsers = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError("");
      const response = await getAllUsers();
      const records = Array.isArray(response)
        ? response
        : response?.items ?? response?.users ?? [];
      setUsers(records.map(mapUser));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        user.name?.toLowerCase().includes(normalizedQuery) ||
        user.email?.toLowerCase().includes(normalizedQuery);
      const matchesRole =
        roleFilter === "All roles" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "All statuses" || user.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const roleCounts = {
    Admin: users.filter((user) => user.role === "Admin").length,
    Analyst: users.filter((user) => user.role === "Analyst").length,
    Viewer: users.filter((user) => user.role === "Viewer").length,
  };
  const activeCount = users.filter((user) => user.status === "Active").length;

  const updateUserRole = async (id, role) => {
    const roleId = { Admin: 1, Analyst: 2, Viewer: 3 }[role];
    const previous = users.find((user) => user.id === id)?.role;
    try {
      setBusyUserId(id);
      setNotice("");
      await updateAdminUser(id, { role_id: roleId });
      setNotice(`Role updated to ${role}.`);
      await fetchUsers(false);
    } catch (err) {
      setNotice(getErrorMessage(err));
      if (previous) await fetchUsers(false);
    } finally {
      setBusyUserId(null);
    }
  };

  const toggleUserStatus = async (id) => {
    const selectedUser = users.find((user) => user.id === id);
    if (!selectedUser) return;
    try {
      setBusyUserId(id);
      setNotice("");
      await updateAdminUser(id, {
        is_active: selectedUser.status !== "Active",
      });
      setNotice(
        selectedUser.status === "Active"
          ? "Account deactivated successfully."
          : "Account activated successfully."
      );
      await fetchUsers(false);
    } catch (err) {
      setNotice(getErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) {
      return;
    }
    try {
      setBusyUserId(id);
      setNotice("");
      await deleteAdminUser(id);
      setNotice("User deleted successfully.");
      await fetchUsers(false);
    } catch (err) {
      setNotice(getErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  const addUser = async (event) => {
    event.preventDefault();
    const fullName = newUser.name.trim();
    const email = newUser.email.trim().toLowerCase();
    if (!fullName || !email || !newUser.password) {
      setNotice("Please complete all required fields.");
      return;
    }

    // Public registration is intentionally fixed to Viewer.
    // Admin-created accounts can be assigned Analyst or Viewer.
    const roleId = { Analyst: 2, Viewer: 3 }[newUser.role];
    if (!roleId) {
      setNotice("Choose Analyst or Viewer for the new account.");
      return;
    }

    try {
      setSubmitting(true);
      setNotice("");
      await createAdminUser({
        full_name: fullName,
        email,
        password: newUser.password,
        role_id: roleId,
      });
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "Viewer",
      });
      setShowAddModal(false);
      setNotice("User created successfully.");
      await fetchUsers(false);
    } catch (err) {
      setNotice(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const exportUsers = () => {
    const headers = ["ID", "Name", "Email", "Role", "Status", "Joined"];
    const rows = users.map((user) => [
      user.id,
      user.name,
      user.email,
      user.role,
      user.status,
      user.joined,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "data-copilot-users.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const inputClass =
    "w-full rounded-xl border border-[var(--dc-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--dc-text)] outline-none transition focus:border-[var(--dc-cyan)] focus:ring-2 focus:ring-cyan-500/10";

  return (
    <section className="dc-rise space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="mt-1 text-sm text-[var(--dc-muted)]">
            Review accounts, manage access roles and monitor account status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="dc-btn"
            onClick={exportUsers}
            disabled={loading || users.length === 0}
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            type="button"
            className="dc-btn !border-cyan-500/40 !bg-cyan-500/10 !text-[var(--dc-cyan)]"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs leading-5 text-[var(--dc-muted)]">
        <strong className="text-emerald-500">Live database:</strong>{" "}
        User records are loaded from the FastAPI backend.
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-xs text-[var(--dc-text)]">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={() => fetchUsers()}
            className="ml-3 underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="dc-glass p-8 text-center">
          <RefreshCw size={22} className="dc-spin mx-auto mb-3 text-[var(--dc-cyan)]" />
          <p className="text-sm text-[var(--dc-muted)]">
            Loading platform users...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Accounts", value: users.length, icon: Users, chip: "dc-chip-cyan" },
              { label: "Active Accounts", value: activeCount, icon: UserCheck, chip: "dc-chip-teal" },
              { label: "Analysts", value: roleCounts.Analyst, icon: BarChart3, chip: "dc-chip-blue" },
              { label: "Viewers", value: roleCounts.Viewer, icon: Shield, chip: "dc-chip-purple" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="dc-glass p-5">
                  <div className="flex items-center justify-between">
                    <div className={`dc-chip ${item.chip}`}>
                      <Icon size={19} />
                    </div>
                    <span className="text-2xl font-bold">{item.value}</span>
                  </div>
                  <p className="mt-4 text-sm text-[var(--dc-muted)]">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="dc-glass overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[var(--dc-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-semibold">Platform Users</h3>
                <p className="mt-1 text-xs text-[var(--dc-muted)]">
                  Showing {filteredUsers.length} of {users.length} accounts
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dc-muted)]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search name or email..."
                    className={`${inputClass} pl-9`}
                  />
                </label>
                <label className="relative">
                  <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dc-muted)]" />
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className={`${inputClass} pl-8 sm:w-36`}
                  >
                    <option>All roles</option>
                    <option>Admin</option>
                    <option>Analyst</option>
                    <option>Viewer</option>
                  </select>
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={`${inputClass} sm:w-40`}
                >
                  <option>All statuses</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-black/[0.04] text-xs uppercase tracking-wider text-[var(--dc-muted)]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Joined</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-[var(--dc-border)] transition hover:bg-cyan-500/[0.035]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-sm font-bold text-[var(--dc-cyan)]">
                            {(user.name || "U")
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--dc-text)]">
                              {user.name}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--dc-muted)]">
                              <Mail size={12} /> {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          aria-label={`Role for ${user.name}`}
                          value={user.role}
                          disabled={busyUserId === user.id}
                          onChange={(event) => updateUserRole(user.id, event.target.value)}
                          className="rounded-lg border border-[var(--dc-border)] bg-transparent px-2.5 py-2 text-xs text-[var(--dc-text)] outline-none focus:border-[var(--dc-cyan)] disabled:opacity-50"
                        >
                          <option>Admin</option>
                          <option>Analyst</option>
                          <option>Viewer</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                            user.status === "Active"
                              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                              : "border-slate-500/25 bg-slate-500/10 text-[var(--dc-muted)]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--dc-muted)]">
                        {user.joined}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title={user.status === "Active" ? "Deactivate account" : "Activate account"}
                            disabled={busyUserId === user.id}
                            onClick={() => toggleUserStatus(user.id)}
                            className="rounded-lg border border-[var(--dc-border)] p-2 text-[var(--dc-muted)] transition hover:border-cyan-500/50 hover:text-[var(--dc-cyan)] disabled:opacity-50"
                          >
                            {user.status === "Active" ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          <button
                            type="button"
                            title="Delete user"
                            disabled={busyUserId === user.id}
                            onClick={() => removeUser(user.id)}
                            className="rounded-lg border border-red-500/20 p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-5 py-14 text-center text-sm text-[var(--dc-muted)]">
                        No users match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setShowAddModal(false);
            }
          }}
        >
          <form onSubmit={addUser} className="dc-glass w-full max-w-md space-y-5 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Add Platform User</h3>
                <p className="mt-1 text-xs text-[var(--dc-muted)]">
                  Create an Analyst or Viewer account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-2 text-[var(--dc-muted)] hover:bg-cyan-500/10"
                aria-label="Close dialog"
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--dc-muted)]">
                Full name
              </label>
              <input
                required
                minLength={2}
                maxLength={150}
                value={newUser.name}
                onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                placeholder="Enter full name"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--dc-muted)]">
                Email address
              </label>
              <input
                required
                type="email"
                value={newUser.email}
                onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
                placeholder="name@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--dc-muted)]">
                Temporary password
              </label>
              <input
                required
                type="password"
                minLength={8}
                maxLength={128}
                value={newUser.password}
                onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--dc-muted)]">
                Access role
              </label>
              <select
                value={newUser.role}
                onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}
                className={inputClass}
              >
                <option>Viewer</option>
                <option>Analyst</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="dc-btn"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="dc-btn !border-cyan-500/40 !bg-cyan-500/10 !text-[var(--dc-cyan)] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={15} className="dc-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Plus size={15} /> Add User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}



/* =========================================

   MAIN COMPONENT



   Props (all optional, wire them to your API):

     data = {

       totalUsers, totalDatasets, activeUsers,

       systemStatus: true | false | "online" | "offline",

       roleCounts: { Admin, Analyst, Viewer },

       system: { backend, database, monitoring }   // true | false | string

     }

     onRefresh    () => void | Promise   (falls back to a page reload)

     refreshing   boolean

========================================= */



export default function AdminDashboard({ data = {}, onRefresh, refreshing = false, isDarkMode = true }) {

  const [activeTab, setActiveTab] = useState("Overview");



  const platform = statusInfo(data.systemStatus);



  const stats = [

    {

      title: "Total Users",

      value: show(data.totalUsers),

      description: "Registered platform users",

      icon: Users,

      chip: "dc-chip-cyan",

    },

    {

      title: "Total Datasets",

      value: show(data.totalDatasets),

      description: "Uploaded datasets",

      icon: Database,

      chip: "dc-chip-blue",

    },

    {

      title: "Active Users",

      value: show(data.activeUsers),

      description: "Currently active accounts",

      icon: Activity,

      chip: "dc-chip-teal",

    },

    {

      title: "System Status",

      value: platform.label === "Not checked" ? "—" : platform.label,

      description: "Backend health monitoring",

      icon: Server,

      chip: "dc-chip-purple",

    },

  ];



  const systemChecks = [

    {

      label: "Backend API",

      icon: CheckCircle2,

      iconClass: "text-[var(--dc-teal)]",

      info: statusInfo(data.system?.backend),

    },

    {

      label: "PostgreSQL",

      icon: Database,

      iconClass: "text-[var(--dc-cyan)]",

      info: statusInfo(data.system?.database),

    },

    {

      label: "Monitoring",

      icon: AlertCircle,

      iconClass: "text-amber-400",

      info: data.system?.monitoring

        ? statusInfo(data.system.monitoring)

        : { label: "Integration pending", dot: "" },

    },

  ];



  function handleRefresh() {

    if (typeof onRefresh === "function") onRefresh();

    else window.location.reload();

  }



  return (

    <div className={`dc-admin space-y-8 ${isDarkMode ? "dc-admin-dark" : "dc-admin-light"}`}>

      <style>{STYLES}</style>



      {/* Header */}

      <section className="dc-rise flex flex-col justify-between gap-5 sm:flex-row sm:items-center">



        <div className="flex items-center gap-4">

          <BrainCircuit size={52} strokeWidth={1.5} className="dc-glow-icon shrink-0" />



          <div>

            <div className="mb-1 flex items-center gap-2">

              <ShieldCheck size={15} className="text-[var(--dc-cyan)]" />

              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--dc-cyan)]">

                Administration

              </span>

            </div>



            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">

              Admin <span className="dc-gradient-text">Control Center</span>

            </h1>



            <p className="mt-1 text-sm text-[var(--dc-muted)]">

              Monitor, manage and control your Data Copilot platform.

            </p>



            <div className="dc-underline mt-3" />

          </div>

        </div>



        <div className="flex items-center gap-3">

          <div className="dc-glass flex items-center gap-2 !rounded-xl px-4 py-3">

            <span className={`dc-dot ${platform.dot}`} />

            <span className="text-xs font-medium">

              Platform {platform.label.toLowerCase()}

            </span>

          </div>



          <button type="button" className="dc-btn" onClick={handleRefresh} disabled={refreshing}>

            <RefreshCw size={14} className={refreshing ? "dc-spin" : ""} />

            Refresh

          </button>

        </div>



      </section>



      {/* Tabs */}

      <nav className="dc-rise flex flex-wrap gap-2" aria-label="Admin sections">

        {TABS.map((tab) => (

          <button

            key={tab}

            type="button"

            onClick={() => setActiveTab(tab)}

            aria-current={activeTab === tab ? "page" : undefined}

            className={`dc-tab ${activeTab === tab ? "dc-tab-active" : ""}`}

          >

            {tab}

          </button>

        ))}

      </nav>



      {activeTab === "Users" ? (

        <UsersPanel />

      ) : activeTab === "Datasets" ? (

        <DatasetPanel />

      ) : activeTab === "System" ? (

        <SystemMonitoring />

      ) : (

        <>

          {/* KPI cards */}

          <section className="dc-rise">

            <div className="mb-5">

              <h2 className="text-lg font-semibold">Platform Overview</h2>

              <p className="mt-1 text-xs text-[var(--dc-muted)]">

                Live metrics appear as soon as data is passed in.

              </p>

            </div>



            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {stats.map((stat) => {

                const Icon = stat.icon;

                return (

                  <div key={stat.title} className="dc-glass dc-glass-hover p-5">

                    <div className="flex items-center justify-between">

                      <div className={`dc-chip ${stat.chip}`}>

                        <Icon size={21} />

                      </div>

                      <ArrowUpRight size={18} className="text-[var(--dc-muted)]" />

                    </div>



                    <div className="mt-5">

                      <p className="text-sm text-[var(--dc-muted)]">{stat.title}</p>

                      <h3 className="mt-2 text-3xl font-bold">{stat.value}</h3>

                      <p className="mt-2 text-xs text-[var(--dc-muted)]">{stat.description}</p>

                    </div>



                    <div className="dc-kpi-line mt-5" />

                  </div>

                );

              })}

            </div>

          </section>



          {/* Role distribution + activity */}

          <section className="dc-rise grid grid-cols-1 gap-6 xl:grid-cols-3">



            <div className="dc-glass dc-glass-line p-6">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <h2 className="font-semibold">Role Distribution</h2>

                  <p className="mt-1 text-xs text-[var(--dc-muted)]">Platform access categories</p>

                </div>

                <Users size={20} className="text-[var(--dc-cyan)]" />

              </div>



              <RoleRing counts={data.roleCounts} />



              <div className="mt-6 space-y-4">

                {ROLE_META.map((item) => (

                  <div key={item.role} className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <span

                        className="h-3 w-3 rounded-full"

                        style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }}

                      />

                      <div>

                        <p className="text-sm font-medium">{item.name}</p>

                        <p className="text-xs text-[var(--dc-muted)]">{item.role}</p>

                      </div>

                    </div>



                    <span className="text-sm font-semibold text-[var(--dc-muted)]">

                      {show(data.roleCounts?.[item.role])}

                    </span>

                  </div>

                ))}

              </div>

            </div>



            <div className="dc-glass dc-glass-line p-6 xl:col-span-2">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <h2 className="font-semibold">Platform Activity</h2>

                  <p className="mt-1 text-xs text-[var(--dc-muted)]">Administrative monitoring modules</p>

                </div>

                <BarChart3 size={20} className="text-[var(--dc-cyan)]" />

              </div>



              <div className="space-y-4">

                {ACTIVITIES.map((activity) => {

                  const Icon = activity.icon;

                  return (

                    <div

                      key={activity.title}

                      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[var(--dc-cyan)]"

                    >

                      <div className={`dc-chip ${activity.chip}`}>

                        <Icon size={20} />

                      </div>



                      <div className="min-w-0 flex-1">

                        <h3 className="text-sm font-semibold">{activity.title}</h3>

                        <p className="mt-1 text-xs text-[var(--dc-muted)]">{activity.description}</p>

                        <p className="mt-2 flex items-center gap-2 text-xs text-[var(--dc-muted)]">

                          <Clock size={13} />

                          Activity data pending

                        </p>

                      </div>

                    </div>

                  );

                })}

              </div>

            </div>



          </section>



          {/* Quick actions */}

          <section className="dc-rise">

            <div className="mb-5">

              <h2 className="text-lg font-semibold">Administrative Actions</h2>

              <p className="mt-1 text-xs text-[var(--dc-muted)]">

                Quick access to platform management modules.

              </p>

            </div>



            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {QUICK_ACTIONS.map((item) => {

                const Icon = item.icon;

                return (

                  <button

                    key={item.title}

                    type="button"

                    onClick={() => setActiveTab(item.tab)}

                    className="dc-glass dc-glass-hover dc-action group p-5 text-left"

                  >

                    <div className="flex items-center justify-between">

                      <div className="dc-chip dc-chip-cyan">

                        <Icon size={22} />

                      </div>

                      <ArrowUpRight

                        size={18}

                        className="text-[var(--dc-muted)] transition group-hover:text-[var(--dc-cyan)]"

                      />

                    </div>



                    <h3 className="mt-5 font-semibold">{item.title}</h3>

                    <p className="mt-2 text-xs leading-5 text-[var(--dc-muted)]">{item.description}</p>

                  </button>

                );

              })}

            </div>

          </section>



          {/* System information */}

          <section className="dc-glass dc-glass-line dc-rise p-6">

            <div className="mb-5 flex items-center gap-3">

              <div className="dc-chip dc-chip-teal">

                <Server size={22} />

              </div>

              <div>

                <h2 className="font-semibold">System Information</h2>

                <p className="text-xs text-[var(--dc-muted)]">Platform infrastructure monitoring</p>

              </div>

            </div>



            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              {systemChecks.map((check) => {

                const Icon = check.icon;

                return (

                  <div key={check.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                    <div className="flex items-center gap-2 text-sm text-[var(--dc-muted)]">

                      <Icon size={16} className={check.iconClass} />

                      {check.label}

                    </div>



                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold">

                      <span className={`dc-dot ${check.info.dot}`} />

                      {check.info.label}

                    </p>

                  </div>

                );

              })}

            </div>

          </section>

        </>

      )}



      {/* Feature pill, same as the login page */}

      <div className="flex justify-center pt-2">

        <div className="dc-feature-bar">

          <div className="dc-feature-item">

            <Database size={22} />

            <span>Intelligent Data</span>

          </div>

          <div className="dc-feature-item">

            <BarChart3 size={22} />

            <span>Predictive Analytics</span>

          </div>

          <div className="dc-feature-item">

            <Sparkles size={22} />

            <span>AI-Powered Insights</span>

          </div>

        </div>

      </div>



    </div>

  );

}