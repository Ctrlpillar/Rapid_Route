import axios from "axios";

// This pulls from Netlify's Environment Variables in production
// and falls back to your local machine during development.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { 
    "Accept": "application/json",
    "Content-Type": "application/json"
  }
});

/**
 * The Interceptor: 
 * This runs automatically before EVERY request sent through this API instance.
 * It looks for a valid session token and attaches it to the Authorization header.
 */
API.interceptors.request.use((config) => {
  // 1. Try to find the Customer/Admin token
  // 2. If not found, try to find the Driver token
  const token = localStorage.getItem("sb_token") || localStorage.getItem("driver_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;