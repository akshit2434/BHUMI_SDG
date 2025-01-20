import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios defaults for the service
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['Content-Type'] = 'application/json';
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

class BhumiService {
    // Get all available products for browsing
    async getAllProducts() {
        try {
            const response = await axiosInstance.get('/products');
            return response.data;
        } catch (error) {
            console.error('Error fetching all products:', error);
            throw error;
        }
    }

    // Get only the user's own products
    async getUserProducts() {
        try {
            const response = await axiosInstance.get('/products/user');
            return response.data;
        } catch (error) {
            console.error('Error fetching user products:', error);
            throw error;
        }
    }

    async addProduct(productData) {
        try {
            const response = await axiosInstance.post('/products', productData);
            return response.data;
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }
}

export default new BhumiService();