import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import modalStyles from '../../../styles/components/shared/modal.module.scss';
import styles from '../../../styles/components/carbon/goals/goalFormModal.module.scss';
import formStyles from '../../../styles/components/carbon/goals/formElements.module.scss';
import GoalsService from '../../../services/goals.service';
import EmissionService from '../../../services/emission.service';
import BaselineSelector from './BaselineSelector';

const GoalFormModal = ({ isOpen, onClose, editingGoal, onSubmitSuccess }) => {
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
    const [formErrors, setFormErrors] = useState({});
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        if (editingGoal) {
            setFormData({
                title: editingGoal.title,
                targetReduction: editingGoal.target_reduction,
                startDate: editingGoal.start_date,
                endDate: editingGoal.end_date,
                baseline: editingGoal.baseline,
                baselineStartDate: editingGoal.baseline_start_date,
                baselineEndDate: editingGoal.baseline_end_date,
                description: editingGoal.description,
                useManualBaseline: true
            });
        }
    }, [editingGoal]);

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

            if (editingGoal) {
                await GoalsService.updateGoal(editingGoal._id, payload);
                toast.success('Goal updated successfully');
            } else {
                await GoalsService.createGoal(payload);
                toast.success('Goal created successfully');
            }

            onSubmitSuccess();
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to save goal');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={modalStyles.overlay} onClick={onClose}>
            <div className={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div className={modalStyles.header}>
                    <h3>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className={modalStyles.content}>
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
                                    />
                                    {formErrors.endDate && <div className={styles.errorText}>{formErrors.endDate}</div>}
                                </div>
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <h4>Baseline Emissions</h4>
                            <div className={styles.formGroup}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.useManualBaseline}
                                        onChange={(e) => setFormData({ ...formData, useManualBaseline: e.target.checked })}
                                    />
                                    Use Manual Baseline
                                </label>
                            </div>

                            {formData.useManualBaseline ? (
                                <>
                                    <div className={styles.formGroup}>
                                        <label>
                                            Baseline Emissions <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.baseline}
                                            onChange={(e) => setFormData({ ...formData, baseline: e.target.value })}
                                            className={formErrors.baseline ? styles.error : ''}
                                        />
                                        {formErrors.baseline && <div className={styles.errorText}>{formErrors.baseline}</div>}
                                    </div>

                                    <div className={styles.formGrid}>
                                        <div className={styles.formGroup}>
                                            <label>
                                                Baseline Start Date <span className={styles.required}>*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.baselineStartDate}
                                                onChange={(e) => setFormData({ ...formData, baselineStartDate: e.target.value })}
                                            />
                                            {formErrors.baselineStartDate && <div className={styles.errorText}>{formErrors.baselineStartDate}</div>}
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>
                                                Baseline End Date <span className={styles.required}>*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.baselineEndDate}
                                                onChange={(e) => setFormData({ ...formData, baselineEndDate: e.target.value })}
                                            />
                                            {formErrors.baselineEndDate && <div className={styles.errorText}>{formErrors.baselineEndDate}</div>}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <BaselineSelector selectedLog={selectedLog} setSelectedLog={setSelectedLog} />
                            )}
                        </div>

                        <div className={styles.formSection}>
                            <h4>Description</h4>
                            <div className={styles.formGroup}>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={modalStyles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            {editingGoal ? 'Update Goal' : 'Create Goal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalFormModal;
