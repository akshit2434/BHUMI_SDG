import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import EmissionService from '../../services/emission.service';
import UnitSelector from './UnitSelector';
import EditMetricModal from './EditMetricModal';
import Loader from '../common/Loader';
import styles from '../../styles/components/carbon/metric-input.module.scss';
import CustomMetricForm from './CustomMetricForm';

const TableHeader = () => (
    <div className={styles.tableHeader}>
        <div className={styles.cellNo}>S.No</div>
        <div className={styles.cellSource}>Source</div>
        <div className={styles.cellValue}>Amount</div>
        <div className={styles.cellUnit}>Unit</div>
        <div className={styles.cellRate}>Emission Rate</div>
        <div className={styles.cellTotal}>Total CO₂e</div>
        <div className={styles.cellActions}></div>
    </div>
);

const MetricInput = ({ onSubmit, onEdit }) => {
    console.log('MetricInput component mounted');

    const [metrics, setMetrics] = useState([]);
    const [error, setError] = useState(null);
    const [inputs, setInputs] = useState({});
    const [selectedUnits, setSelectedUnits] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUnitSelector, setShowUnitSelector] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMetric, setEditingMetric] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCustomMetricForm, setShowCustomMetricForm] = useState(false);

    const initializeData = async () => {
        setIsLoading(true);
        try {
            console.group('MetricInput - Data Initialization');
            console.log('Fetching metrics data...');

            const response = await EmissionService.getUserUnits();
            console.log('Raw Response:', response);

            if (!response?.metrics || !Array.isArray(response.metrics)) {
                throw new Error('Invalid metrics data format received');
            }

            console.log('Metrics Array:', response.metrics);

            const initialInputs = {};
            const initialUnits = {};
            response.metrics.forEach(metric => {
                if (metric && metric.name && metric.units && metric.units.length > 0) {
                    initialInputs[metric.name] = '';
                    initialUnits[metric.name] = metric.units[0].name;
                }
            });

            console.log('Initial Inputs:', initialInputs);
            console.log('Initial Units:', initialUnits);

            setMetrics(response.metrics);
            setInputs(initialInputs);
            setSelectedUnits(initialUnits);

            console.groupEnd();

        } catch (error) {
            console.error('Failed to initialize data:', error);
            setError('Failed to load metrics');
        } finally {
            setIsLoading(false);
        }
    };

    const hasInitialized = useRef(false);

    useEffect(() => {
        console.log('MetricInput useEffect triggered');
        if (!hasInitialized.current) {
            console.log('Initializing data...');
            initializeData();
            hasInitialized.current = true;
        }
    }, []);

    const handleInputChange = (metricName, value) => {
        setInputs(prev => ({
            ...prev,
            [metricName]: value
        }));
    };

    const handleUnitChange = (metricName, unit) => {
        setSelectedUnits(prev => ({
            ...prev,
            [metricName]: unit
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Add this check to prevent unintended submissions
        if (e.target.tagName === 'BUTTON' && e.target.type !== 'submit') {
            return;
        }

        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            // Format inputs with proper structure
            const formattedInputs = {};
            Object.entries(inputs).forEach(([key, value]) => {
                if (value && value !== '') {
                    const metric = metrics.find(m => m.name === key);
                    const unit = selectedUnits[key];
                    const unitData = metric.units.find(u => u.name === unit);

                    if (metric && unitData) {
                        formattedInputs[key] = {
                            value: parseFloat(value),
                            unit: unit,
                            emission_factor: unitData.emission_factor
                        };
                    }
                }
            });

            if (Object.keys(formattedInputs).length === 0) {
                toast.error('Please enter at least one emission value.');
                return;
            }

            const response = await EmissionService.logEmission({
                inputs: formattedInputs,
                industry_name: 'default'
            });

            setInputs({}); // Reset form
            if (onSubmit) {
                onSubmit(response);
            }
            toast.success('Emissions logged successfully!');

        } catch (error) {
            console.error('Failed to log emissions:', error);
            toast.error(error.message || 'Failed to log emissions');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnitSelect = async (unit) => {
        if (selectedMetric) {
            try {
                handleUnitChange(selectedMetric, unit.name);
                setShowUnitSelector(false);
                setSelectedMetric(null);
            } catch (error) {
                console.error('Failed to update unit:', error);
                toast.error('Failed to update unit');
            }
        }
    };

    const handleMetricEdit = async (originalName, newName) => {
        setIsLoading(true);
        try {
            console.log('Updating metric name:', { originalName, newName });
            await EmissionService.updateMetricName(originalName, newName);

            // Update local state first
            setMetrics(prevMetrics => prevMetrics.map(metric =>
                metric.name === originalName
                    ? { ...metric, name: newName }
                    : metric
            ));

            // Update inputs and selectedUnits
            setInputs(prev => {
                const newInputs = { ...prev };
                if (originalName in newInputs) {
                    newInputs[newName] = newInputs[originalName];
                    delete newInputs[originalName];
                }
                return newInputs;
            });

            setSelectedUnits(prev => {
                const newUnits = { ...prev };
                if (originalName in newUnits) {
                    newUnits[newName] = newUnits[originalName];
                    delete newUnits[originalName];
                }
                return newUnits;
            });

            await initializeData();
            if (onEdit) onEdit();
            toast.success('Metric updated successfully');
        } catch (error) {
            console.error('Failed to edit metric:', error);
            toast.error('Failed to update metric name');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMetricDelete = async (metricName) => {
        setIsLoading(true);
        try {
            await EmissionService.deleteMetric(metricName);

            // Update local state immediately
            setMetrics(prevMetrics => prevMetrics.filter(m => m.name !== metricName));

            // Clean up related states
            setInputs(prev => {
                const newInputs = { ...prev };
                delete newInputs[metricName];
                return newInputs;
            });

            setSelectedUnits(prev => {
                const newUnits = { ...prev };
                delete newUnits[metricName];
                return newUnits;
            });

            // Close modal and show success message
            setShowEditModal(false);
            toast.success('Metric deleted successfully');

            // Refresh the full data
            await initializeData();

            if (onEdit) onEdit();
        } catch (error) {
            console.error('Failed to delete metric:', error);
            toast.error(error.message || 'Failed to delete metric');
        } finally {
            setIsLoading(false);
        }
    };

    const openUnitSelector = (metricName) => {
        setSelectedMetric(metricName);
        setShowUnitSelector(true);
    };

    const handleCustomMetricSubmit = async (metricData) => {
        try {
            const response = await EmissionService.addCustomMetric(metricData);
            await initializeData(); // Refresh the metrics list
            toast.success('Custom metric added successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to add custom metric');
        }
    };

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    const renderTableRow = (metric, index) => {
        const currentUnit = selectedUnits[metric.name];
        const currentValue = inputs[metric.name] || '';
        const emissionFactor = metric.units.find(u => u.name === currentUnit)?.emission_factor || 0;
        const total = (parseFloat(currentValue || 0) * emissionFactor).toFixed(2);

        return (
            <div key={metric.name} className={styles.tableRow}>
                <div className={styles.cellNo}>{index + 1}</div>
                <div className={styles.cellSource}>
                    {metric.name.charAt(0).toUpperCase() + metric.name.slice(1)}
                </div>
                <div className={styles.cellValue}>
                    <input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleInputChange(metric.name, e.target.value)}
                        className={styles.input}
                        placeholder="0.00"
                    />
                </div>
                <div className={styles.cellUnit}>
                    <button
                        type="button"
                        onClick={() => openUnitSelector(metric.name)}
                        className={styles.unitSelectBtn}
                    >
                        {currentUnit} ▾
                    </button>
                </div>
                <div className={styles.cellRate}>
                    <span className={styles.rateValue}>{emissionFactor}</span>
                    <span className={styles.rateUnit}>kgCO₂e/{currentUnit}</span>
                </div>
                <div className={styles.cellTotal}>{total}</div>
                <div className={styles.cellActions}>
                    <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => {
                            setEditingMetric(metric);
                            setShowEditModal(true);
                        }}
                    >
                        Edit
                    </button>
                </div>
            </div>
        );
    };

    return (
        <motion.form
            className={styles.section}
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.header}>
                <h3 className={styles.title}>Log New Emissions</h3>
                <button
                    type="button"
                    className={styles.addMetricBtn}
                    onClick={() => setShowCustomMetricForm(true)}
                >
                    Add Custom Metric
                </button>
            </div>

            <div className={styles.tableContainer}>
                <TableHeader />
                {isLoading ? (
                    <div className={styles.loaderContainer}>
                        <Loader size="medium" text="Updating metrics..." />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="metrics-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {metrics.map((metric, index) => renderTableRow(metric, index))}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            <motion.button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitButton}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {isSubmitting ? 'Calculating...' : 'Calculate & Log Emissions'}
            </motion.button>

            <AnimatePresence>
                {showUnitSelector && selectedMetric && (
                    <UnitSelector
                        isOpen={showUnitSelector}
                        onClose={() => setShowUnitSelector(false)}
                        sourceType={selectedMetric}
                        currentUnit={selectedUnits[selectedMetric]}
                        onSelect={handleUnitSelect}
                        metric={metrics.find(m => m.name === selectedMetric)}
                    />
                )}

                {showEditModal && editingMetric && (
                    <EditMetricModal
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        title={editingMetric.name}
                        onSave={(newName) => handleMetricEdit(editingMetric.name, newName)}
                        onDelete={() => handleMetricDelete(editingMetric.name)}
                    />
                )}

                {showCustomMetricForm && (
                    <CustomMetricForm
                        isOpen={showCustomMetricForm}
                        onClose={() => setShowCustomMetricForm(false)}
                        onSubmit={handleCustomMetricSubmit}
                    />
                )}
            </AnimatePresence>
        </motion.form>
    );
};

export default MetricInput;
