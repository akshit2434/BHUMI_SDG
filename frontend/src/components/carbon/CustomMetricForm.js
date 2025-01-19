import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import styles from '../../styles/components/carbon/unit-selector.module.scss';

const CustomMetricForm = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        metric_name: '',
        unit_name: '',
        emission_factor: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling up

        if (!formData.metric_name || !formData.unit_name || !formData.emission_factor) {
            toast.error('All fields are required');
            return;
        }

        try {
            await onSubmit(formData);
            setFormData({ metric_name: '', unit_name: '', emission_factor: '' });
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to add custom metric');
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className={styles.overlay}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
            >
                <div className={styles.header}>
                    <h3>Add Custom Metric</h3>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>
                        <FaTimes />
                    </button>
                </div>
                <div className={styles.formContent}>
                    <div className={styles.formGroup}>
                        <label>Metric Name:</label>
                        <input
                            type="text"
                            name="metric_name"
                            value={formData.metric_name}
                            onChange={handleChange}
                            placeholder="e.g., Water Consumption"
                            className={styles.customInput}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Unit Name:</label>
                        <input
                            type="text"
                            name="unit_name"
                            value={formData.unit_name}
                            onChange={handleChange}
                            placeholder="e.g., m³"
                            className={styles.customInput}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Emission Factor (kgCO₂e/unit):</label>
                        <input
                            type="number"
                            name="emission_factor"
                            value={formData.emission_factor}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            className={styles.customInput}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            onClick={handleFormSubmit}
                            className={styles.submitBtn}
                        >
                            Add Metric
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelBtn}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CustomMetricForm;
