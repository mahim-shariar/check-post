import axios from "axios";
import { redirectToLogin } from "./authUtils"; // You'll need to create this helper

const API_URL = "http://31.97.70.167:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Store token in memory
let authToken = null;

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Token expired or invalid
        clearAuthToken();
        redirectToLogin("?error=session_expired");
      } else if (error.response.status === 403) {
        // Invalid token or access denied
        clearAuthToken();
        redirectToLogin("?error=invalid_token");
      }
    }
    return Promise.reject(error);
  }
);

// Token management
export const setAuthToken = (token) => {
  authToken = token;
  // Also set it in axios defaults
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const clearAuthToken = () => {
  authToken = null;
  delete api.defaults.headers.common["Authorization"];
};

export const getCurrentToken = () => {
  return authToken;
};

export const login = async (username, password) => {
  try {
    const response = await api.post("/checkpost/login", { username, password });
    // Get token from Authorization header
    const token = response.headers.authorization?.split(" ")[1];
    if (token) {
      setAuthToken(token);
    }
    console.log("its from api");
    console.log("token:", token);
    return { response, token };
  } catch (error) {
    throw error;
  }
};

export const getProfile = async () => {
  return api.get("/checkpost/profile");
};

export const logout = async () => {
  try {
    await api.post("/checkpost/logout");
  } finally {
    clearAuthToken();
  }
};

export default api;
