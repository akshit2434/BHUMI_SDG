import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class GoalsService {
    async getGoals() {
        try {
            const response = await axios.get(`${API_URL}/goals`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            console.log('Goals service response:', response.data); // Debug log
            return response.data.goals;
        } catch (error) {
            console.error('Error fetching goals:', error.response?.data || error);
            throw new Error(error.response?.data?.error || 'Failed to fetch goals');
        }
    }

    async createGoal(goalData) {
        try {
            const validationResult = this.validateGoalData(goalData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.error);
            }

            console.log('Sending goal data to server:', goalData); // Debug log

            const response = await axios.post(
                `${API_URL}/goals`,
                goalData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.data || response.status !== 201) {
                throw new Error('Invalid server response');
            }

            return response.data;
        } catch (error) {
            if (error.response?.data?.missing_fields) {
                throw new Error(`Missing required fields: ${error.response.data.missing_fields.join(', ')}`);
            }
            throw new Error(error.response?.data?.error || error.message || 'Failed to create goal');
        }
    }

    validateGoalData(data) {
        const required = [
            'title',
            'targetReduction',
            'startDate',
            'endDate',
            'baseline',
            'baselineStartDate',
            'baselineEndDate'
        ];

        const missingFields = required.filter(field => {
            const value = data[field];
            return value === null || value === undefined || value === '';
        });

        if (missingFields.length > 0) {
            return {
                isValid: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            };
        }

        // Additional validation for numeric fields
        if (isNaN(parseFloat(data.targetReduction)) || parseFloat(data.targetReduction) <= 0) {
            return {
                isValid: false,
                error: 'Target reduction must be a positive number'
            };
        }

        if (isNaN(parseFloat(data.baseline)) || parseFloat(data.baseline) <= 0) {
            return {
                isValid: false,
                error: 'Baseline must be a positive number'
            };
        }

        return { isValid: true };
    }

    async updateGoal(goalId, goalData) {
        try {
            const validationResult = this.validateGoalData(goalData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.error);
            }

            console.log('Updating goal data:', goalData); // Debug log

            const response = await axios.put(
                `${API_URL}/goals/${goalId}`,
                goalData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error updating goal:', error.response?.data || error);
            throw new Error(error.response?.data?.error || 'Failed to update goal');
        }
    }

    async deleteGoal(goalId) {
        try {
            const response = await axios.delete(
                `${API_URL}/goals/${goalId}`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to delete goal');
        }
    }

    async getGoalProgress(goalId) {
        try {
            const response = await axios.get(
                `${API_URL}/goals/${goalId}/progress`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch goal progress');
        }
    }

    async getEmissionsForPeriod(startDate, endDate) {
        try {
            if (!startDate || !endDate) {
                throw new Error('Start and end dates are required');
            }

            const response = await axios.get(
                `${API_URL}/emissions/period`,
                {
                    params: {
                        start: startDate,
                        end: endDate
                    },
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching emissions:', error.response?.data || error);
            throw new Error(error.response?.data?.error || 'Failed to fetch emissions for period');
        }
    }
}

export default new GoalsService();
