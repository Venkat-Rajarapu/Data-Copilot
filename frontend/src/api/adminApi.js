import axiosClient from "./axiosClient";

// Admin user-management API.
// axiosClient is expected to have the /api/v1 base URL and
// the Authorization bearer-token interceptor configured.
export const getAllUsers = async () => {
  const response = await axiosClient.get("/users/");
  return response.data;
};

export const createAdminUser = async (userData) => {
  const response = await axiosClient.post("/users/", userData);
  return response.data;
};

export const updateAdminUser = async (userId, userData) => {
  const response = await axiosClient.put(`/users/${userId}`, userData);
  return response.data;
};

export const deleteAdminUser = async (userId) => {
  const response = await axiosClient.delete(`/users/${userId}`);
  return response.data;
};
