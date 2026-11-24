import { useEffect, useState } from "react";

import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

// Layout Components
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

// Dashboard Pages
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import DatasetPage from "../features/datasets/pages/DatasetPage";
import AdminDashboard from "../features/admin/pages/AdminDashboard";
import DataQualityDashboard from "../features/data-quality/pages/DataQualityDashboard";
import DataCleaningPage from "../features/data-quality/pages/DataCleaningPage";
import DataProcessingPage from "../features/data-quality/pages/DataProcessingPage";

// Dataset Version History
import DatasetVersionsPage from "../features/data-quality/pages/DatasetVersionsPage";

// Authentication
import LoginPage from "../features/auth/pages/LoginPage";
import { useAuth } from "../context/AuthContext";

import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";

// ==========================================
// 1. ROLE MANAGEMENT
// ==========================================

const getUserRole = (user) => {
  if (!user) return null;

  const roleId = user.role_id ?? user.role?.id;

  const roleMap = {
    1: "admin",
    2: "analyst",
    3: "viewer",
  };

  return (
    roleMap[roleId] ||
    user.role?.name?.toLowerCase() ||
    user.role_name?.toLowerCase() ||
    (typeof user.role === "string"
      ? user.role.toLowerCase()
      : null)
  );
};

const getDashboardPath = (role) => {
  switch (role?.toLowerCase()) {
    case "admin":
      return "/admin/dashboard";

    case "analyst":
      return "/analyst/dashboard";

    case "viewer":
      return "/viewer/dashboard";

    default:
      return "/login";
  }
};

// ==========================================
// 2. APPLICATION LAYOUT
// ==========================================

function AppLayout() {
  const { user, role, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const normalizedRole = (
    role || getUserRole(user) || ""
  ).toLowerCase();

  // ACTIVE SIDEBAR PAGE

  const getActivePage = () => {
    const path = location.pathname;

    if (path.match(/^\/datasets\/[^/]+\/versions\/?$/)) {
      return "Dataset History";
    }

    if (path === "/datasets") return "Datasets";

    if (path === "/data-quality") return "Data Quality";

    if (path === "/data-cleaning") return "Data Cleaning";

    if (path === "/data-processing") return "Data Processing";

    return "Dashboard";
  };

  const [activePage, setActivePage] = useState(getActivePage);

  useEffect(() => {
    setActivePage(getActivePage());
  }, [location.pathname]);

  // THEME MANAGEMENT

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("data-copilot-theme");

    return savedTheme
      ? savedTheme === "dark"
      : true;
  });

  const toggleTheme = () => {
    setIsDarkMode((current) => !current);
  };

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", theme);

    localStorage.setItem("data-copilot-theme", theme);
  }, [isDarkMode]);

  // LOGOUT

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  // SIDEBAR NAVIGATION

  const handleNavigation = (page) => {
    switch (page) {
      case "Dashboard":
        navigate(getDashboardPath(normalizedRole));
        break;

      case "Datasets":
        navigate("/datasets");
        break;

      case "Data Quality":
        navigate("/data-quality");
        break;

      case "Data Cleaning":
        navigate("/data-cleaning");
        break;

      case "Data Processing":
        navigate("/data-processing");
        break;

      default:
        console.log(`${page} module is not available yet.`);
        break;
    }
  };

  // PAGE RENDERING

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        if (normalizedRole === "admin") {
          return <AdminDashboard isDarkMode={isDarkMode} />;
        }

        return <DashboardPage isDarkMode={isDarkMode} />;

      case "Datasets":
        return <DatasetPage isDarkMode={isDarkMode} />;

      case "Dataset History":
        return <DatasetVersionsPage isDarkMode={isDarkMode} />;

      case "Data Quality":
        return <DataQualityDashboard isDarkMode={isDarkMode} />;

      case "Data Cleaning":
        return <DataCleaningPage isDarkMode={isDarkMode} />;

      case "Data Processing":
        return <DataProcessingPage isDarkMode={isDarkMode} />;

      default:
        return (
          <div className="glass-card flex min-h-[450px] items-center justify-center text-center">
            <div>
              <div className="mb-5 text-4xl">✨</div>

              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                {activePage}
              </h1>

              <p className="mt-3 text-sm text-[var(--color-muted)]">
                This module is currently under development.
              </p>

              <span className="mt-6 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-500">
                COMING SOON
              </span>
            </div>
          </div>
        );
    }
  };

  // MAIN LAYOUT

  return (
    <div
      data-theme={isDarkMode ? "dark" : "light"}
      className="flex min-h-screen w-full bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-300"
    >
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        user={user}
        role={normalizedRole}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">

        <Navbar
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        {/* USER INFORMATION */}

        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Welcome, {user?.full_name || user?.name || "User"}
            </p>

            <p className="text-xs text-[var(--color-muted)]">
              {user?.email}
            </p>

            <span className="mt-1 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold capitalize text-cyan-500">
              {normalizedRole}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>

        {/* MAIN CONTENT */}

        <main className="min-h-[calc(100vh-80px)] flex-1 p-4 sm:p-5 md:p-8">
          {renderPage()}
        </main>

        {/* FOOTER */}

        <footer className="border-t border-[var(--color-border)] px-5 py-5 text-center text-xs text-[var(--color-muted)]">
          <p>
            © {new Date().getFullYear()} Data Copilot.
            All rights reserved.
          </p>

          <p className="mt-1">
            AI-Powered Business Analytics &amp;
            Decision Intelligence Platform
          </p>
        </footer>

      </div>
    </div>
  );
}

// ==========================================
// 3. LOGIN ROUTE
// ==========================================

function LoginRoute() {
  const { setUser, isLoggedIn, role, user } = useAuth();

  const navigate = useNavigate();

  const currentRole = (
    role || getUserRole(user) || ""
  ).toLowerCase();

  if (isLoggedIn) {
    return (
      <Navigate
        to={getDashboardPath(currentRole)}
        replace
      />
    );
  }

  const handleLogin = (userData) => {
    setUser(userData);

    navigate(
      getDashboardPath(getUserRole(userData)),
      {
        replace: true,
      }
    );
  };

  return <LoginPage onLogin={handleLogin} />;
}

// ==========================================
// 4. APPLICATION ROUTES
// ==========================================

function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC ROUTES */}

      <Route
        path="/login"
        element={<LoginRoute />}
      />

      {/* PROTECTED ROUTES */}

      <Route element={<ProtectedRoute />}>

        {/* ADMIN DASHBOARD */}

        <Route
          path="/admin/dashboard"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <AppLayout />
            </RoleBasedRoute>
          }
        />

        {/* ANALYST DASHBOARD */}

        <Route
          path="/analyst/dashboard"
          element={
            <RoleBasedRoute allowedRoles={["analyst"]}>
              <AppLayout />
            </RoleBasedRoute>
          }
        />

        {/* VIEWER DASHBOARD */}

        <Route
          path="/viewer/dashboard"
          element={
            <RoleBasedRoute allowedRoles={["viewer"]}>
              <AppLayout />
            </RoleBasedRoute>
          }
        />

        {/* DATASET MANAGEMENT */}

        <Route
          path="/datasets"
          element={
            <RoleBasedRoute
              allowedRoles={["admin", "analyst", "viewer"]}
            >
              <AppLayout />
            </RoleBasedRoute>
          }
        />

        {/* DATASET VERSION HISTORY */}

        <Route
          path="/datasets/:datasetId/versions"
          element={
            <RoleBasedRoute
              allowedRoles={["admin", "analyst", "viewer"]}
            >
              <AppLayout />
            </RoleBasedRoute>
          }
        />

        {/* DATA QUALITY DASHBOARD */}

        <Route
          path="/data-quality"
          element={
            <RoleBasedRoute
              allowedRoles={["admin", "analyst", "viewer"]}
            >
              <AppLayout />
            </RoleBasedRoute>
          }
        />

        {/* DATA CLEANING */}

        <Route
          path="/data-cleaning"
          element={
            <RoleBasedRoute
              allowedRoles={["admin", "analyst"]}
            >
              <AppLayout />
            </RoleBasedRoute>
          }
        />

        {/* DATA PROCESSING */}

        <Route
          path="/data-processing"
          element={
            <RoleBasedRoute
              allowedRoles={["admin", "analyst"]}
            >
              <AppLayout />
            </RoleBasedRoute>
          }
        />

      </Route>

      {/* DEFAULT ROUTES */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}

export default AppRoutes;