import axios from "axios";
import getCookie from "./get-cookie";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie("csrftoken");
    console.log("CSRF Token:", csrfToken);

    if (csrfToken && config.headers) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
