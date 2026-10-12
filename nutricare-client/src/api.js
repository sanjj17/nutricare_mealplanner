import axios from "axios";

// Override this in .env.local if the API is hosted somewhere else:
// REACT_APP_API_URL=http://localhost:8080
const API_ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:8080").replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getApiError(error, fallback = "Something went wrong. Please try again.") {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
  if (error?.request) return "We couldn't reach the NutriCare server. Check that the backend is running on port 8080 and try again.";
  return error?.message || fallback;
}

export default api;
