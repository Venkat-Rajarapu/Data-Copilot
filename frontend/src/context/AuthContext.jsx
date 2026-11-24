import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  isAuthenticated,
} from "../api/authApi";

// Create authentication context
const AuthContext = createContext(null);

// Extract user object from different possible API response formats
const extractUser = (response) => {
  if (!response) return null;

  return (
    response.user ||
    response.data?.user ||
    response.data ||
    response
  );
};

// Normalize user role
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
    null
  );
};

// Authentication Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authentication status
  const isLoggedIn = Boolean(user);

  // Current user's role
  const role = getUserRole(user);

  // Restore session when application starts
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        if (!isAuthenticated()) {
          return;
        }

        const response = await getCurrentUser();
        const currentUser = extractUser(response);

        if (mounted) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Session restoration failed:", err);

        logoutUser();

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Login
  const login = useCallback(async (credentials) => {
    setError(null);

    try {
      await loginUser(credentials);

      const response = await getCurrentUser();
      const currentUser = extractUser(response);

      if (!currentUser) {
        throw new Error("Unable to retrieve user information.");
      }

      setUser(currentUser);

      return currentUser;
    } catch (err) {
      logoutUser();

      const message =
        err.response?.data?.detail ||
        err.message ||
        "Login failed. Please try again.";

      setError(message);

      throw err;
    }
  }, []);

  // Registration
  const register = useCallback(async (userData) => {
    setError(null);

    try {
      const response = await registerUser(userData);

      return extractUser(response);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Registration failed. Please try again.";

      setError(message);

      throw err;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
    setError(null);
  }, []);

  // Refresh current user information
  const refreshUser = useCallback(async () => {
    try {
      if (!isAuthenticated()) {
        setUser(null);
        return null;
      }

      const response = await getCurrentUser();
      const currentUser = extractUser(response);

      setUser(currentUser);

      return currentUser;
    } catch (err) {
      logout();
      throw err;
    }
  }, [logout]);

  // Context values
  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      error,
      isLoggedIn,
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [
      user,
      role,
      loading,
      error,
      isLoggedIn,
      login,
      register,
      logout,
      refreshUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom authentication hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
};

export default AuthContext;