import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleBasedRoute = ({ allowedRoles = [], children }) => {
  const { user, role, loading, isLoggedIn } = useAuth();

  // Wait until authentication is restored
  if (loading) {
    return (
      <div className="role-loading-screen">
        <div className="role-loader"></div>
        <p>Checking access permissions...</p>

        <style>{`
          .role-loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background: #07111f;
            color: #94a3b8;
            font-family: Arial, sans-serif;
          }

          .role-loader {
            width: 38px;
            height: 38px;
            border: 4px solid rgba(34, 211, 238, 0.2);
            border-top-color: #22d3ee;
            border-radius: 50%;
            animation: role-spin 0.8s linear infinite;
          }

          @keyframes role-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Redirect unauthenticated users
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize role names
  const userRole = role?.toLowerCase();

  // Check whether the user's role is allowed
  const hasAccess = allowedRoles
    .map((allowedRole) => allowedRole.toLowerCase())
    .includes(userRole);

  // Redirect users without permission
  if (!hasAccess) {
    switch (userRole) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;

      case "analyst":
        return <Navigate to="/analyst/dashboard" replace />;

      case "viewer":
        return <Navigate to="/viewer/dashboard" replace />;

      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Render authorized content
  return children ? children : <Outlet />;
};

export default RoleBasedRoute;