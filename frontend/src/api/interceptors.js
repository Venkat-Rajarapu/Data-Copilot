import api from "./axios";
import { tokenStorage } from "../utils/tokenStorage";

// Attach JWT access token to API requests
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Authentication failed or access token expired.");
    }

    return Promise.reject(error);
  }
);

export default api;