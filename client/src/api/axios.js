import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
  timeout: 30000, // 30s — covers Render cold-start wakeup on mobile networks
});

// On network error, log the real cause to help debug on mobile
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network Error = no response at all (CORS block, timeout, server asleep)
      console.error(
        "[API] Network Error — no response received.",
        "\nURL:", error.config?.baseURL + error.config?.url,
        "\nThis is usually: (1) CORS mismatch, (2) Render cold start timeout, or (3) HTTP vs HTTPS."
      );
    }
    return Promise.reject(error);
  }
);

export default api;
