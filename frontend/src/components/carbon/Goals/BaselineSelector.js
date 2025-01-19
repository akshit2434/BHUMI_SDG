import React, { useState, useEffect } from 'react';
import EmissionService from '../../../services/emission.service';
import styles from '../../../styles/components/carbon/goals/baselineSelector.module.scss';

const BaselineSelector = ({ selectedLog, setSelectedLog }) => {
    const [emissionLogs, setEmissionLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEmissionLogs = async () => {
            try {
                setLoading(true);
                const response = await EmissionService.getAllEmissions();
                if (response && response.data) {
                    // Sort logs by date, most recent first
                    const sortedLogs = response.data.sort((a, b) =>
                        new Date(b.end_date) - new Date(a.end_date)
                    );
                    setEmissionLogs(sortedLogs);
                }
            } catch (err) {
                console.error('Error fetching emission logs:', err);
                setError('Failed to load emission logs');
            } finally {
                setLoading(false);
            }
        };

        fetchEmissionLogs();
    }, []);

    if (loading) return <div>Loading emission logs...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    if (!emissionLogs || emissionLogs.length === 0) {
        return (
            <div className={styles.noData}>
                No emission logs available. Please add emission data first or use manual baseline.
            </div>
        );
    }

    return (
        <div className={styles.selectorContainer}>
            <div className={styles.logList}>
                {emissionLogs.map(log => (
                    <div
                        key={log._id}
                        className={`${styles.logItem} ${selectedLog?._id === log._id ? styles.selected : ''}`}
                        onClick={() => setSelectedLog(log)}
                    >
                        <div className={styles.logInfo}>
                            <span className={styles.date}>
                                {new Date(log.start_date).toLocaleDateString()} - {new Date(log.end_date).toLocaleDateString()}
                            </span>
                            <span className={styles.emissions}>
                                {parseFloat(log.total_emissions).toFixed(2)} tCO₂e
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {selectedLog && (
                <div className={styles.selectedLogDetails}>
                    <h4>Selected Baseline Period</h4>
                    <p>Period: {new Date(selectedLog.start_date).toLocaleDateString()} - {new Date(selectedLog.end_date).toLocaleDateString()}</p>
                    <p>Total Emissions: {parseFloat(selectedLog.total_emissions).toFixed(2)} tCO₂e</p>
                </div>
            )}
        </div>
    );
};

export default BaselineSelector;
