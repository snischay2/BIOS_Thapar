
import axios from "axios";

const api = axios.create({
  baseURL: `${(
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "")}/api`,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("TXFORT_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
