import React, { useState, useEffect, useCallback } from 'react';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import styles from '../../styles/components/carbon/goals.module.scss';
import GoalsService from '../../services/goals.service';
import EmissionService from '../../services/emission.service';

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        targetReduction: '',
        startDate: '',
        endDate: '',
        baseline: '',
        baselineStartDate: '',
        baselineEndDate: '',
        description: '',
        useManualBaseline: false
    });
    const [emissionLogs, setEmissionLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [goalProgress, setGoalProgress] = useState({});
    const [formErrors, setFormErrors] = useState({});

    const fetchGoals = useCallback(async () => {
        try {
            setLoading(true);
            const goalsData = await GoalsService.getGoals();
            console.log('Fetched goals:', goalsData); // Debug log
            if (Array.isArray(goalsData)) {
                setGoals(goalsData);
            } else {
                console.error('Invalid goals data format:', goalsData);
                setGoals([]);
            }
        } catch (error) {
            console.error('Fetch goals error:', error);
            toast.error(error.message || 'Failed to fetch goals');
            setGoals([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEmissionLogs = async () => {
        try {
            const response = await EmissionService.getEmissionHistory();
            setEmissionLogs(response.emissions || []);
        } catch (error) {
            console.error('Error fetching emission logs:', error);
            toast.error('Failed to fetch emission logs');
        }
    };

    useEffect(() => {
        let mounted = true;

        const getGoals = async () => {
            if (mounted) {
                await fetchGoals();
            }
        };

        getGoals();
        fetchEmissionLogs();

        return () => {
            mounted = false;
        };
    }, [fetchGoals]);

    const validateForm = () => {
        const errors = {};
        const missingFields = [];

        // Basic Information validation
        if (!formData.title.trim()) {
            errors.title = 'Title is required';
            missingFields.push('Title');
        }
        if (!formData.targetReduction) {
            errors.targetReduction = 'Target reduction is required';
            missingFields.push('Target Reduction');
        }

        // Timeline validation
        if (!formData.startDate) {
            errors.startDate = 'Start date is required';
            missingFields.push('Start Date');
        }
        if (!formData.endDate) {
            errors.endDate = 'End date is required';
            missingFields.push('End Date');
        }

        // Baseline validation
        if (formData.useManualBaseline) {
            if (!formData.baseline) {
                errors.baseline = 'Baseline emissions value is required';
                missingFields.push('Baseline Emissions');
            }
            if (!formData.baselineStartDate) {
                errors.baselineStartDate = 'Baseline start date is required';
                missingFields.push('Baseline Start Date');
            }
            if (!formData.baselineEndDate) {
                errors.baselineEndDate = 'Baseline end date is required';
                missingFields.push('Baseline End Date');
            }
        } else if (!selectedLog) {
            errors.baselineLog = 'Please select a baseline measurement period';
            missingFields.push('Baseline Measurement Period');
        }

        // Date range validation
        if (formData.endDate && formData.startDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end <= start) {
                errors.endDate = 'End date must be after start date';
            }
        }

        if (formData.baselineEndDate && formData.baselineStartDate) {
            const start = new Date(formData.baselineStartDate);
            const end = new Date(formData.baselineEndDate);
            if (end <= start) {
                errors.baselineEndDate = 'Baseline end date must be after start date';
            }
        }

        setFormErrors(errors);

        if (missingFields.length > 0) {
            toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setLoading(true);

            const payload = {
                title: formData.title.trim(),
                targetReduction: parseFloat(formData.targetReduction),
                startDate: formData.startDate,
                endDate: formData.endDate,
                baseline: formData.useManualBaseline
                    ? parseFloat(formData.baseline)
                    : parseFloat(selectedLog.total_emissions),
                baselineStartDate: formData.useManualBaseline
                    ? formData.baselineStartDate
                    : selectedLog.start_date.split('T')[0],
                baselineEndDate: formData.useManualBaseline
                    ? formData.baselineEndDate
                    : selectedLog.end_date.split('T')[0],
                description: formData.description.trim()
            };

            console.log('Submitting goal payload:', payload);

            let response;
            if (editingGoal) {
                // Update existing goal
                response = await GoalsService.updateGoal(editingGoal._id, payload);
                toast.success('Goal updated successfully');
            } else {
                // Create new goal
                response = await GoalsService.createGoal(payload);
                toast.success('Goal created successfully');
            }

            await fetchGoals(); // Refresh goals list
            setShowModal(false);
            resetForm();

        } catch (error) {
            console.error('Goal submission error:', error);
            toast.error(error.message || 'Failed to save goal');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (goalId) => {
        if (!goalId) {
            toast.error('Invalid goal ID');
            return;
        }

        if (window.confirm('Are you sure you want to delete this goal?')) {
            try {
                await GoalsService.deleteGoal(goalId);
                toast.success('Goal deleted successfully');
                fetchGoals();
            } catch (error) {
                toast.error(error.message || 'Failed to delete goal');
            }
        }
    };

    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setFormData({
            title: goal.title,
            targetReduction: goal.target_reduction, // Changed from targetReduction
            startDate: goal.start_date, // Changed from startDate
            endDate: goal.end_date, // Changed from endDate
            baseline: goal.baseline,
            baselineStartDate: goal.baseline_start_date, // Changed from baselineStartDate
            baselineEndDate: goal.baseline_end_date, // Changed from baselineEndDate
            description: goal.description,
            useManualBaseline: true // Set to true since we're editing existing data
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingGoal(null);
        setFormData({
            title: '',
            targetReduction: '',
            startDate: '',
            endDate: '',
            baseline: '',
            baselineStartDate: '',
            baselineEndDate: '',
            description: '',
            useManualBaseline: false
        });
    };

    const handleLogSelect = (log) => {
        setSelectedLog(log);
        setFormData({
            ...formData,
            baseline: log.total_emissions,
            baselineStartDate: log.start_date,
            baselineEndDate: log.end_date
        });
    };

    const calculateGoalProgress = async (goal) => {
        try {
            const now = new Date();
            const startDate = new Date(goal.start_date);
            const endDate = new Date(goal.end_date);

            // Add debug logs
            console.log('Calculating progress for goal:', {
                id: goal._id,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                now: now.toISOString()
            });

            if (startDate > now) {
                return {
                    goalId: goal._id,
                    currentEmissions: 0,
                    reduction: '0.0',
                    progress: '0.0',
                    onTrack: true,
                    notStarted: true
                };
            }

            const effectiveEndDate = now > endDate ? endDate : now;

            // Format dates to match backend expectations
            const emissionsStartDate = startDate.toISOString().split('T')[0];
            const emissionsEndDate = effectiveEndDate.toISOString().split('T')[0];

            console.log('Fetching emissions for period:', {
                startDate: emissionsStartDate,
                endDate: emissionsEndDate
            });

            const emissions = await GoalsService.getEmissionsForPeriod(emissionsStartDate, emissionsEndDate);
            console.log('Received emissions data:', emissions); // Debug log

            if (!emissions.data || !Array.isArray(emissions.data)) {
                console.warn('No emissions data found for period');
                return {
                    goalId: goal._id,
                    progress: '0.0',
                    onTrack: false,
                    noData: true
                };
            }

            // Rest of calculation logic
            const periods = emissions.data.map(e => ({
                start: new Date(e.start_date),
                end: new Date(e.end_date),
                emissions: parseFloat(e.total_emissions) // Ensure numeric value
            }));

            if (periods.length === 0) {
                return {
                    goalId: goal._id,
                    currentEmissions: 0,
                    reduction: '0.0',
                    progress: '0.0',
                    onTrack: false,
                    noData: true
                };
            }

            periods.sort((a, b) => a.start - b.start);

            const movingAverage = periods.reduce((acc, period, idx, arr) => {
                if (idx === 0) return period.emissions;
                return (acc * idx + period.emissions) / (idx + 1);
            }, 0);

            const baseline = parseFloat(goal.baseline);
            const reduction = ((baseline - movingAverage) / baseline) * 100;
            const targetReduction = parseFloat(goal.target_reduction);
            const progress = Math.min(100, (reduction / targetReduction) * 100);

            console.log('Calculated progress:', { // Debug log
                baseline,
                movingAverage,
                reduction,
                targetReduction,
                progress
            });

            return {
                goalId: goal._id,
                currentEmissions: movingAverage,
                reduction: reduction.toFixed(1),
                progress: Math.max(0, progress.toFixed(1)),
                onTrack: reduction >= (targetReduction * (getTimeProgress(goal) / 100))
            };
        } catch (error) {
            console.error('Error calculating goal progress:', error);
            return {
                goalId: goal._id,
                progress: 0,
                onTrack: false,
                error: error.message
            };
        }
    };

    const getTimeProgress = (goal) => {
        // Fix property names to match backend response
        if (!goal.start_date || !goal.end_date) return 0;

        const start = new Date(goal.start_date);
        const end = new Date(goal.end_date);
        const now = new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

        const total = end - start;
        const elapsed = now - start;
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date instanceof Date && !isNaN(date) ? date.getFullYear() : '';
        } catch {
            return '';
        }
    };

    const renderGoalCard = (goal) => {
        const progress = goalProgress[goal._id] || { progress: 0, onTrack: false };
        const timeProgress = getTimeProgress(goal);

        // Add debug logs
        console.log('Rendering goal card:', {
            goalId: goal._id,
            progress,
            timeProgress
        });

        // Validate date fields before rendering
        const startYear = formatDate(goal.start_date);
        const endYear = formatDate(goal.end_date);
        const baselineStartYear = formatDate(goal.baseline_start_date);
        const baselineEndYear = formatDate(goal.baseline_end_date);

        // Handle future or not started goals
        const isNotStarted = progress.notStarted;
        const hasNoData = progress.noData;

        return (
            <div key={goal._id} className={styles.goalCard}>
                <div className={styles.goalHeader}>
                    <h3>{goal.title}</h3>
                    <div className={styles.actions}>
                        <button onClick={() => handleEdit(goal)}><FaEdit /></button>
                        <button onClick={() => handleDelete(goal._id)}><FaTrash /></button>
                    </div>
                </div>
                <div className={styles.goalDetails}>
                    <p>Target: {goal.target_reduction?.toFixed(1) || 0}% reduction by {endYear || 'N/A'}</p>
                    <p>Baseline: {goal.baseline?.toFixed(2) || 0} tCO₂e ({baselineStartYear || 'N/A'} - {baselineEndYear || 'N/A'})</p>
                    <p>Current Reduction: {isNotStarted ? 'Goal period not started' : (hasNoData ? 'No data available' : `${progress.reduction || 0}%`)}</p>

                    <div className={styles.progressBars}>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progress} ${isNotStarted ? styles.notStarted : (progress.onTrack ? styles.onTrack : styles.behind)}`}
                                style={{ width: `${progress.progress}%` }}
                            />
                            <span>{isNotStarted ? 'Not started' : `${progress.progress}% of target`}</span>
                        </div>
                        <div className={styles.timeProgress}>
                            <div
                                className={styles.progress}
                                style={{ width: `${timeProgress}%` }}
                            />
                            <span>{timeProgress.toFixed(0)}% time elapsed</span>
                        </div>
                    </div>

                    {!isNotStarted && progress.currentEmissions !== undefined && (
                        <p className={styles.currentEmissions}>
                            Current: {progress.currentEmissions.toFixed(2)} tCO₂e
                            <span className={progress.onTrack ? styles.onTrackLabel : styles.behindLabel}>
                                {hasNoData ? '(No Data)' : (progress.onTrack ? '(On Track)' : '(Behind Schedule)')}
                            </span>
                        </p>
                    )}
                </div>
            </div>
        );
    };

    // Add helper function to validate dates
    const isValidDate = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date instanceof Date && !isNaN(date);
    };

    // Update useEffect to fetch progress for all goals
    useEffect(() => {
        const updateProgress = async () => {
            const progressData = {};
            for (const goal of goals) {
                if (goal && goal._id) {  // Add null check
                    progressData[goal._id] = await calculateGoalProgress(goal);
                }
            }
            setGoalProgress(progressData);
        };

        if (goals.length > 0) {
            updateProgress();
        }
    }, [goals]);

    const renderBaselineSection = () => (
        <div className={styles.baselineSection}>
            <h4>Baseline Measurement</h4>
            <div className={styles.baselineToggle}>
                <label>
                    <input
                        type="checkbox"
                        checked={formData.useManualBaseline}
                        onChange={(e) => setFormData({
                            ...formData,
                            useManualBaseline: e.target.checked
                        })}
                    />
                    Enter baseline manually
                </label>
            </div>

            {formData.useManualBaseline ? (
                <div className={styles.manualBaseline}>
                    <div className={styles.formGroup}>
                        <label>
                            Baseline Emissions (tCO₂e) <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.baseline}
                            onChange={(e) => setFormData({
                                ...formData,
                                baseline: e.target.value
                            })}
                            className={formErrors.baseline ? styles.error : ''}
                        />
                        {formErrors.baseline && <div className={styles.errorText}>{formErrors.baseline}</div>}
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>
                                Start Date <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.baselineStartDate}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    baselineStartDate: e.target.value
                                })}
                                className={formErrors.baselineStartDate ? styles.error : ''}
                            />
                            {formErrors.baselineStartDate &&
                                <div className={styles.errorText}>{formErrors.baselineStartDate}</div>
                            }
                        </div>
                        <div className={styles.formGroup}>
                            <label>
                                End Date <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.baselineEndDate}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    baselineEndDate: e.target.value
                                })}
                                className={formErrors.baselineEndDate ? styles.error : ''}
                            />
                            {formErrors.baselineEndDate &&
                                <div className={styles.errorText}>{formErrors.baselineEndDate}</div>
                            }
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.formGroup}>
                    <label>
                        Select from emission history <span className={styles.required}>*</span>
                    </label>
                    <select
                        value={selectedLog ? selectedLog._id : ''}
                        onChange={(e) => {
                            const log = emissionLogs.find(l => l._id === e.target.value);
                            handleLogSelect(log);
                        }}
                        className={formErrors.baselineLog ? styles.error : ''}
                    >
                        <option value="">Select a measurement period</option>
                        {emissionLogs.map(log => (
                            <option key={log._id} value={log._id}>
                                {new Date(log.start_date).toLocaleDateString()} -
                                {new Date(log.end_date).toLocaleDateString()}
                                ({log.total_emissions.toFixed(2)} tCO₂e)
                            </option>
                        ))}
                    </select>
                    {formErrors.baselineLog && <div className={styles.errorText}>{formErrors.baselineLog}</div>}
                </div>
            )}
        </div>
    );

    const renderForm = () => (
        <form onSubmit={handleSubmit}>
            <div className={styles.formSection}>
                <h4>Basic Information</h4>
                <div className={styles.formGroup}>
                    <label>
                        Title <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={formErrors.title ? styles.error : ''}
                    />
                    {formErrors.title && <div className={styles.errorText}>{formErrors.title}</div>}
                </div>

                <div className={styles.formGroup}>
                    <label>
                        Target Reduction (%) <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="number"
                        value={formData.targetReduction}
                        onChange={(e) => setFormData({ ...formData, targetReduction: e.target.value })}
                        className={formErrors.targetReduction ? styles.error : ''}
                    />
                    {formErrors.targetReduction && <div className={styles.errorText}>{formErrors.targetReduction}</div>}
                </div>
            </div>

            <div className={styles.formSection}>
                <h4>Goal Timeline</h4>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>
                            Start Date <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className={formErrors.startDate ? styles.error : ''}
                        />
                        {formErrors.startDate && <div className={styles.errorText}>{formErrors.startDate}</div>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>
                            End Date <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className={formErrors.endDate ? styles.error : ''}
                        />
                        {formErrors.endDate && <div className={styles.errorText}>{formErrors.endDate}</div>}
                    </div>
                </div>
            </div>

            {renderBaselineSection()}

            <div className={styles.formSection}>
                <h4>Additional Information</h4>
                <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="3"
                    />
                </div>
            </div>

            <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                    Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
            </div>
        </form>
    );

    return (
        <div className={styles.goalsContainer}>
            <div className={styles.header}>
                <h2>Emission Reduction Goals</h2>
                <button
                    className={styles.addButton}
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                >
                    <FaPlus /> Add Goal
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading goals...</div>
            ) : (
                <div className={styles.goalsGrid}>
                    {goals.length === 0 ? (
                        <div className={styles.noGoals}>
                            No goals set yet. Click "Add Goal" to create your first goal.
                        </div>
                    ) : (
                        goals.map(goal => renderGoalCard(goal))
                    )}
                </div>
            )}

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h3>
                        {renderForm()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Goals;