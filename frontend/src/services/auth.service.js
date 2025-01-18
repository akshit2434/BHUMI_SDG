import axios from 'axios';

// Add console log to debug env variable
console.log('Environment Variables:', {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
});

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add axios interceptor for JWT
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

class AuthService {
    async login(email, password) {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });

            if (response.data.access_token) {
                // Store token directly
                localStorage.setItem('token', response.data.access_token);
            }
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Authentication failed';
            throw new Error(message);
        }
    }

    logout() {
        localStorage.removeItem('token');
    }

    getCurrentUser() {
        return localStorage.getItem('token');
    }

    isAuthenticated() {
        const token = this.getCurrentUser();
        return !!token;
    }

    getAuthHeader() {
        const token = this.getCurrentUser();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async updateUserDetails(userDetails) {
        try {
            const response = await fetch(`${API_URL}/user/details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(userDetails)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update user details');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }
}

export default new AuthService();
