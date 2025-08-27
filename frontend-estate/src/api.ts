import axios from "axios";
import getCookie from "./get-cookie";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to ensure CSRF token is available
const ensureCSRFToken = async () => {
  let token = getCookie("csrftoken");
  
  if (!token) {
    try {
      // Fetch CSRF token if not available
      await api.get('/api/csrf-cookie/');
      token = getCookie("csrftoken");
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
  }
  
  return token;
};

api.interceptors.request.use(
  async (config) => {
    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {} as any;
    }

    // For methods that need CSRF protection
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      const csrfToken = await ensureCSRFToken();
      console.log("CSRF Token:", csrfToken);

      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      } else {
        console.warn("No CSRF token available");
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle CSRF failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If CSRF error and we haven't already retried
    if (error.response?.status === 403 && 
        error.response?.data?.detail?.includes('CSRF') && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        // Clear existing token and fetch new one
        document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        await api.get('/api/csrf-cookie/');
        const newToken = getCookie("csrftoken");
        
        if (newToken) {
          originalRequest.headers["X-CSRFToken"] = newToken;
          return api(originalRequest);
        }
      } catch (retryError) {
        console.error("Failed to retry with new CSRF token:", retryError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;