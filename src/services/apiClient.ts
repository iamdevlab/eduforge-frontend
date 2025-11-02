// import axios from "axios";

// const apiClient = axios.create({
//     baseURL: "http://localhost:8000/", // replace with your backend URL
// });

// export default apiClient;

// apiClient.ts
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore'; // Import auth store
import { useUpgradeModalStore } from '../stores/useUpgradeModalStore'; // Import modal store

// const apiClient = axios.create({
//     baseURL: 'http://localhost:8000/', // Your backend URL
// });

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // Uses the .env variable
});

// --- 1. Request Interceptor (Adds Auth Token) ---
apiClient.interceptors.request.use(
    (config) => {
        // Get the token from the auth store
        const { token } = useAuthStore.getState();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- 2. Response Interceptor (Catches 402 Error) ---
apiClient.interceptors.response.use(
    (response) => {
        // Any status code that lies within the range of 2xx causes this function to trigger
        return response;
    },
    (error) => {
        // Any status codes that fall outside the range of 2xx cause this function to trigger
        if (error.response && error.response.status === 402) {
            // This is our "Payment Required" error!
            // Open the global modal.
            const { showModal } = useUpgradeModalStore.getState();
            showModal();
        }

        // Also handle 401 Unauthorized (e.g., expired token)
        if (error.response && error.response.status === 401) {
            // Log the user out
            const { logout } = useAuthStore.getState();
            logout();
            // You could also redirect to login:
            // window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default apiClient;