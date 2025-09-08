import axios from 'axios';

// Get CSRF token from XSRF-TOKEN cookie (set by Sanctum)
const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop()?.split(';').shift() || '');
    }
    return null;
};

// Create axios instance with default configuration
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    timeout: 10000, // 10 second timeout to match Cypress config
});

// Request interceptor to handle CSRF tokens and authentication
api.interceptors.request.use(
    async (config) => {
        // Ensure CSRF cookie is set before making API calls
        try {
            await fetch('/sanctum/csrf-cookie', {
                credentials: 'include',
            });
        } catch (error) {
            console.warn('Failed to fetch CSRF cookie:', error);
        }

        // Add CSRF token to headers
        const token = getCookie('XSRF-TOKEN');
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }

        // Add auth token for admin routes
        const authToken = localStorage.getItem('auth_token');
        if (authToken && config.url?.includes('/admin/')) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle network errors (no response received)
        if (!error.response) {
            if (error.code === 'ECONNABORTED') {
                console.error('Request timeout');
            } else if (error.code === 'ERR_NETWORK') {
                console.error('Network error - unable to connect to server');
            } else if (error.message === 'Network Error') {
                console.error('Network error occurred');
            } else {
                console.error('Request failed:', error.message);
            }
            // Return a standardized error for network issues
            const networkError = new Error('Network connection failed. Please check your internet connection and try again.');
            networkError.name = 'NetworkError';
            return Promise.reject(networkError);
        }
        
        // Handle HTTP response errors
        if (error.response?.status === 401) {
            // Handle unauthorized access - redirect to login
            console.error('Unauthorized access - redirecting to login');
            window.location.href = '/login';
        } else if (error.response?.status >= 500) {
            // Handle server errors
            console.error('Server error:', error.response?.data);
        }
        return Promise.reject(error);
    }
);

export default api;