import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  timeout: 30000,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("data_copilot_access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle multipart file uploads
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        "API Error:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error("Network Error: Backend is not responding.");
    } else {
      console.error("Request Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;