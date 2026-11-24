const ACCESS_TOKEN_KEY = "datacopilot_access_token";
const REFRESH_TOKEN_KEY = "datacopilot_refresh_token";

export const tokenStorage = {
  // Save JWT tokens
  setTokens: (accessToken, refreshToken) => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  // Get access token
  getAccessToken: () => {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // Get refresh token
  getRefreshToken: () => {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Remove tokens during logout
  clearTokens: () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};