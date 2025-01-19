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

    async calculateGoalProgress(goal) {
        try {
            const now = new Date();
            const startDate = new Date(goal.start_date);
            const endDate = new Date(goal.end_date);

            if (startDate > now) {
                return {
                    goalId: goal._id,
                    currentEmissions: "0",
                    reduction: "0.0",
                    progress: "0.0",
                    onTrack: true,
                    notStarted: true
                };
            }

            // Get emissions data for calculating daily average
            const effectiveEndDate = now > endDate ? endDate : now;
            const emissions = await this.getEmissionsForPeriod(
                goal.baseline_start_date,
                goal.baseline_end_date
            );

            if (!emissions.data || !Array.isArray(emissions.data)) {
                return {
                    goalId: goal._id,
                    currentEmissions: "0",
                    progress: "0.0",
                    onTrack: false,
                    noData: true
                };
            }

            // Calculate daily average emissions
            let totalEmissions = 0;
            let totalDays = 0;

            emissions.data.forEach(period => {
                const periodStart = new Date(period.start_date);
                const periodEnd = new Date(period.end_date);
                const periodDays = (periodEnd - periodStart) / (1000 * 60 * 60 * 24);
                totalDays += periodDays;
                totalEmissions += parseFloat(period.total_emissions || 0);
            });

            const dailyAverageEmissions = totalDays > 0 ? totalEmissions / totalDays : 0;

            // Calculate emissions for goal period
            const goalElapsedDays = Math.max(0, Math.min(
                (effectiveEndDate - startDate) / (1000 * 60 * 60 * 24),
                (now - startDate) / (1000 * 60 * 60 * 24)
            ));

            const currentEmissions = Number(dailyAverageEmissions * goalElapsedDays) || 0;
            const baseline = Number(goal.baseline) || 0;
            const targetReduction = Number(goal.target_reduction) || 0;

            // Calculate reduction percentage
            const reduction = baseline > 0 ? ((baseline - currentEmissions) / baseline) * 100 : 0;
            const progress = targetReduction > 0 ? Math.min(100, (reduction / targetReduction) * 100) : 0;

            // Calculate time progress
            const totalDuration = endDate - startDate;
            const elapsed = now - startDate;
            const timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

            // Calculate expected progress and status
            const expectedProgress = targetReduction * (timeProgress / 100);
            const onTrack = reduction >= expectedProgress;
            const slightlyBehind = !onTrack && reduction >= (expectedProgress * 0.85);

            return {
                goalId: goal._id,
                currentEmissions: currentEmissions.toString(),
                dailyAverage: dailyAverageEmissions.toFixed(2),
                reduction: reduction.toFixed(1),
                progress: Math.max(0, progress).toFixed(1),
                timeProgress: timeProgress.toFixed(1),
                expectedProgress: expectedProgress.toFixed(1),
                slightlyBehind,
                onTrack
            };
        } catch (error) {
            console.error('Error calculating goal progress:', error);
            return {
                goalId: goal._id,
                currentEmissions: "0",
                progress: "0",
                onTrack: false,
                error: error.message
            };
        }
    }
}

export default new GoalsService();
