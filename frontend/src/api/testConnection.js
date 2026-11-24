import api from "./axios";

export const testBackendConnection = async () => {
  try {
    const response = await api.get("/health/");

    console.log("Backend connected successfully!");
    console.log("Response:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "Backend connection failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};