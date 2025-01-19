import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';
import EmissionService from '../../services/emission.service';
import styles from '../../styles/components/carbon/emission-history.module.scss';
import Loader from '../common/Loader';

const formatEmissionValue = (input) => {
    if (!input) return 'N/A';
    return `${input.value} ${input.unit} (${input.emission_factor} kgCO₂e/${input.unit})`;
};

const formatEmissions = (emissions) => {
    const tonnage = emissions / 1000; // Convert from kg to tonnes
    if (tonnage < 0.1) {
        return `${emissions.toFixed(1)} kg CO₂e`;
    }
    return `${tonnage.toFixed(2)} tonnes CO₂e`;
};

const calculateDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const EmissionCard = ({ emission }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const periodDays = calculateDaysBetween(emission.start_date, emission.end_date);
    const dailyEmissions = emission.total_emissions / periodDays;

    return (
        <motion.div
            className={`${styles.historyCard} ${isExpanded ? styles.expanded : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            layout="position"
        >
            <div className={styles.cardHeader}>
                <div className={styles.headerInfo}>
                    <div className={styles.period}>
                        <span className={styles.periodLabel}>Period:</span>
                        <span className={styles.dates}>
                            {formatDate(emission.start_date)} - {formatDate(emission.end_date)}
                        </span>
                        <span className={styles.duration}>({periodDays} days)</span>
                    </div>
                    <div className={styles.emissions}>
                        <span className={styles.total}>
                            Total: {formatEmissions(emission.total_emissions)}
                        </span>
                        <span className={styles.daily}>
                            Daily Avg: {formatEmissions(dailyEmissions)}
                        </span>
                    </div>
                </div>
                <div className={styles.headerControls}>
                    <FaChevronDown
                        className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
                    />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className={styles.cardContent}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className={styles.inputsList}>
                            {Object.entries(emission.inputs).map(([source, data]) => (
                                <div key={source} className={styles.inputItem}>
                                    <span className={styles.sourceLabel}>
                                        {source.charAt(0).toUpperCase() + source.slice(1)}
                                    </span>
                                    <span className={styles.sourceValue}>
                                        {formatEmissionValue(data)}
                                    </span>
                                    <span className={styles.sourceEmissions}>
                                        {formatEmissions(data.value * data.emission_factor)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )
                }
            </AnimatePresence >
        </motion.div >
    );
};

const EmissionHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, [page]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await EmissionService.getEmissionHistory(page);
            setHistory(data.emissions);
            setTotalPages(data.pages);
            setError(null);
        } catch (error) {
            setError('Failed to fetch emission history');
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader text="Loading emission history..." />;
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p>{error}</p>
                <button onClick={fetchHistory}>Retry</button>
            </div>
        );
    }

    return (
        <motion.div
            className={styles.historyContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {history.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No emission records found</p>
                </div>
            ) : (
                <>
                    <div className={styles.historyList}>
                        <AnimatePresence>
                            {history.map(emission => (
                                <EmissionCard
                                    key={emission._id}
                                    emission={emission}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};

export default EmissionHistory;
