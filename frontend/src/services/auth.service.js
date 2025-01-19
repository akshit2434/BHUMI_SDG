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

// Update global axios interceptors
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            const authService = new AuthService();
            authService.logout();

            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

class AuthService {
    async checkAccount(email) {
        if (!email) {
            throw new Error('Email is required');
        }

        try {
            const response = await axios.post(`${API_URL}/auth/check`, { email }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error checking account');
        }
    }

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

    async register(email) {
        if (!email) {
            throw new Error('Email is required');
        }

        try {
            const response = await axios.post(`${API_URL}/auth/register`, {
                email
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.temp_token) {
                // Store temporary token for completing registration
                localStorage.setItem('temp_token', response.data.temp_token);
            }
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }

    async completeRegistration(userDetails) {
        try {
            const tempToken = localStorage.getItem('temp_token');
            if (!tempToken) {
                throw new Error('Registration session expired');
            }

            const response = await axios.post(
                `${API_URL}/auth/complete-registration`,
                userDetails,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tempToken}`
                    }
                }
            );

            if (response.data.access_token) {
                localStorage.removeItem('temp_token');
                localStorage.setItem('token', response.data.access_token);
            }
            return response.data;
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('token');
    }

    getCurrentUser() {
        return localStorage.getItem('token');
    }

    async isAuthenticated() {
        try {
            const token = this.getCurrentUser();
            if (!token) return false;

            // First verify with backend
            const response = await axios.get(`${API_URL}/protected`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });

            return response.status === 200;
        } catch (error) {
            // Clear any invalid tokens
            this.logout();
            return false;
        }
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
