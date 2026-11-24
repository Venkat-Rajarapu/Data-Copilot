import api from "./axiosClient";
import { tokenStorage } from "../utils/tokenStorage";

// ============================================
// 1. USER LOGIN
// ============================================

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", {
    email: credentials.email,
    password: credentials.password,
  });

  const {
    access_token,
    refresh_token,
  } = response.data;

  // Store JWT tokens
  tokenStorage.setTokens(access_token, refresh_token);

  return response.data;
};

// ============================================
// 2. USER REGISTRATION
// ============================================

export const registerUser = async (userData) => {
  const response = await api.post("/users/", {
    full_name: userData.full_name,
    email: userData.email,
    password: userData.password,
  });

  return response.data;
};

// ============================================
// 3. GET CURRENT AUTHENTICATED USER
// ============================================

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

// ============================================
// 4. REFRESH ACCESS TOKEN
// ============================================

export const refreshAccessToken = async () => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error("Refresh token not found.");
  }

  const response = await api.post("/auth/refresh", {
    refresh_token: refreshToken,
  });

  const {
    access_token,
    refresh_token: newRefreshToken,
  } = response.data;

  tokenStorage.setTokens(
    access_token,
    newRefreshToken || refreshToken
  );

  return response.data;
};

// ============================================
// 5. USER LOGOUT
// ============================================

export const logoutUser = () => {
  tokenStorage.clearTokens();
};

// ============================================
// 6. CHECK AUTHENTICATION STATUS
// ============================================

export const isAuthenticated = () => {
  return Boolean(tokenStorage.getAccessToken());
};