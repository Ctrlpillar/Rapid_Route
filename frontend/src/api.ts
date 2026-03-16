import axios from "axios";

// This pulls from your .env files (VITE_API_URL)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Accept": "application/json" }
});

// This "Interceptor" automatically attaches your login token to every call
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("sb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;