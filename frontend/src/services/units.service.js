import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class UnitsService {
    async getUserUnits() {
        try {
            const response = await axios.get(`${API_URL}/units`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching units:', error);
            throw error;
        }
    }

    async updateUserUnits(units) {
        try {
            const response = await axios.post(`${API_URL}/units/update`, {
                units
            }, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error updating units:', error);
            throw error;
        }
    }
}

export default new UnitsService();
