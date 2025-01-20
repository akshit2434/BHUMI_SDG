import React, { useState, useEffect } from 'react';
import emissionService from '../../../services/emission.service';
import styles from '../../../styles/components/carbon/reports/reportSelector.module.scss';

const ReportSelector = ({ onGenerate }) => {
    const [logs, setLogs] = useState([]);
    const [selectedLogs, setSelectedLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await emissionService.getEmissionHistory(1, 100);
                if (response && response.emissions) {
                    // Sort emissions by date
                    const sortedEmissions = response.emissions.sort((a, b) =>
                        new Date(b.start_date) - new Date(a.start_date)
                    );
                    setLogs(sortedEmissions);
                } else {
                    throw new Error('No emission data available');
                }
                setError(null);
            } catch (err) {
                setError('Failed to fetch emission logs');
                console.error('Error fetching logs:', err);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const handleSelection = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            if (selectedLogs.length < 2) {
                setSelectedLogs([...selectedLogs, value]);
            }
        } else {
            setSelectedLogs(selectedLogs.filter((id) => id !== value));
        }
    };

    const handleSubmit = () => {
        if (selectedLogs.length === 0) {
            setError('Please select at least one log');
            return;
        }
        onGenerate(selectedLogs);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateRange = (log) => {
        const startDate = formatDate(log.start_date);
        const endDate = formatDate(log.end_date);
        return `${startDate} - ${endDate}`;
    };

    const formatEmissionValue = (value) => {
        if (typeof value !== 'number') return '0 kg CO₂e';

        // Convert to tons if value is over 1000 kg
        if (value >= 1000) {
            return `${(value / 1000).toFixed(2)} tons CO₂e`;
        }
        return `${value.toFixed(2)} kg CO₂e`;
    };

    if (loading) return <div className={styles.loading}>Loading emission logs...</div>;

    if (logs.length === 0) {
        return (
            <div className={styles.container}>
                <h2 className={styles.title}>Select Emission Logs</h2>
                <div className={styles.error}>
                    No emission logs found. Please log some emissions first.
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Select Emission Logs</h2>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.instructions}>
                Select up to two emission logs to generate a comparative report
            </div>

            <div className={styles.logList}>
                {logs.map((log) => (
                    <div key={log._id} className={styles.logItem}>
                        <label className={styles.logLabel}>
                            <input
                                type="checkbox"
                                value={log._id}
                                onChange={handleSelection}
                                checked={selectedLogs.includes(log._id)}
                                disabled={selectedLogs.length >= 2 && !selectedLogs.includes(log._id)}
                                className={styles.checkbox}
                            />
                            <span className={styles.logDetails}>
                                <span className={styles.logDateRange}>
                                    {formatDateRange(log)}
                                </span>
                                <span className={styles.logEmissions}>
                                    {formatEmissionValue(log.total_emissions)}
                                </span>
                            </span>
                        </label>
                    </div>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                className={styles.generateButton}
                disabled={selectedLogs.length === 0}
            >
                Generate Report
            </button>
        </div>
    );
};

export default ReportSelector;