import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-content">
          <div className="auth-spinner"></div>

          <h2>Data Copilot</h2>

          <p>Verifying your authentication...</p>
        </div>

        <style>{`
          .auth-loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #07111f;
            color: #ffffff;
            font-family: Arial, sans-serif;
          }

          .auth-loading-content {
            text-align: center;
          }

          .auth-spinner {
            width: 42px;
            height: 42px;
            margin: 0 auto 20px;
            border: 4px solid rgba(34, 211, 238, 0.2);
            border-top-color: #22d3ee;
            border-radius: 50%;
            animation: auth-spin 0.8s linear infinite;
          }

          .auth-loading-content h2 {
            margin-bottom: 8px;
            font-size: 24px;
          }

          .auth-loading-content p {
            color: #94a3b8;
            font-size: 14px;
          }

          @keyframes auth-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Redirect unauthenticated users to Login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Render protected page
  return children ? children : <Outlet />;
};

export default ProtectedRoute;