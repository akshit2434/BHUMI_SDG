import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class EmissionService {
    async logEmission(emissionData) {
        try {
            // Transform the data to match backend expectations
            const transformedInputs = {};
            Object.entries(emissionData.inputs).forEach(([key, data]) => {
                if (data.value && data.value !== '') {  // Only include non-empty values
                    transformedInputs[key] = {
                        value: parseFloat(data.value),
                        unit: data.unit,
                        emission_factor: parseFloat(data.emission_factor)
                    };
                }
            });

            // Don't send if no valid inputs
            if (Object.keys(transformedInputs).length === 0) {
                throw new Error('No valid emission values provided');
            }

            const response = await axios.post(
                `${API_URL}/emissions/log`,
                {
                    inputs: transformedInputs,
                    industry_name: emissionData.industry_name || 'default'
                },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data) {
                throw new Error('No response data received');
            }

            return response.data;
        } catch (error) {
            console.error('Error logging emission:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to log emission';
            throw new Error(errorMessage);
        }
    }

    async getEmissionHistory(page = 1, limit = 10) {
        try {
            console.log('Fetching emission history...');
            const response = await axios.get(
                `${API_URL}/emissions/history?page=${page}&limit=${limit}`,
                { withCredentials: true }
            );

            if (!response.data || !Array.isArray(response.data.emissions)) {
                throw new Error('Invalid response format');
            }

            return {
                emissions: response.data.emissions,
                total: response.data.total,
                pages: response.data.pages
            };
        } catch (error) {
            console.error('Error fetching history:', error.response?.data || error);
            throw new Error(error.response?.data?.message || 'Failed to fetch emission history');
        }
    }

    async getUserUnits() {
        try {
            console.log('Fetching user units...');
            const response = await axios.get(`${API_URL}/units`, { withCredentials: true });

            console.group('EmissionService - getUserUnits Response');
            console.log('Raw Response:', response);
            console.log('Response Data:', response.data);
            console.log('Metrics Array:', response.data.metrics);
            console.groupEnd();

            if (!response.data || !Array.isArray(response.data.metrics)) {
                console.error('Invalid response format:', response.data);
                throw new Error('Invalid metrics data format');
            }

            return {
                metrics: response.data.metrics
            };
        } catch (error) {
            console.error('Error fetching units:', error.response?.data || error);
            throw new Error(error.response?.data?.error || 'Failed to fetch metrics');
        }
    }

    async updateUserUnits(units) {
        try {
            const response = await axios.put(
                `${API_URL}/units`,
                { units },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data) {
                throw new Error('No response data received');
            }

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            return response.data;
        } catch (error) {
            console.error('Error updating units:', error);
            throw new Error(error.response?.data?.error || error.message || 'Failed to update user units');
        }
    }

    async updateMetricName(originalName, newName) {
        try {
            console.log('Updating metric name:', { originalName, newName });
            const response = await axios.put(
                `${API_URL}/emissions/metrics`,
                {
                    originalName,
                    newName
                },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            return response.data;
        } catch (error) {
            console.error('Error updating metric name:', error.response?.data || error);
            throw new Error(error.response?.data?.error || 'Failed to update metric name');
        }
    }

    async deleteMetric(name) {
        try {
            console.log('Deleting metric:', name);
            const response = await axios.delete(
                `${API_URL}/emissions/metrics`,
                {
                    data: { name },
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            return response.data;
        } catch (error) {
            console.error('Error deleting metric:', error.response?.data || error);
            throw new Error(error.response?.data?.error || 'Failed to delete metric');
        }
    }

    async addCustomMetric(metricData) {
        try {
            const response = await axios.post(
                `${API_URL}/metrics/add`,
                metricData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data) {
                throw new Error('No response data received');
            }

            return response.data;
        } catch (error) {
            console.error('Error adding custom metric:', error);
            throw new Error(error.response?.data?.error || error.message || 'Failed to add custom metric');
        }
    }

    calculateTotalEmissions(inputs, units) {
        let total = 0;

        // Calculate all inputs uniformly
        Object.entries(inputs).forEach(([key, value]) => {
            if (value && !isNaN(value)) {
                const emissionFactor = this.getEmissionFactor(key, units[key]);
                total += parseFloat(value) * emissionFactor;
            }
        });

        return total;
    }

    getEmissionFactor(sourceType, unit) {
        const factors = {
            electricity: { 'kWh': 0.233, 'MWh': 233 },
            gas: { 'm³': 2.02, 'ft³': 0.057 },
            fuel: { 'L': 2.31, 'gal': 8.74 },
            waste: { 'kg': 2.86, 'ton': 2860 }
        };
        return factors[sourceType]?.[unit] || 0;
    }
}

export default new EmissionService();
