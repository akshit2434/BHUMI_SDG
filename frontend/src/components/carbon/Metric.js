import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import EmissionService from '../../services/emission.service';
import styles from '../../styles/components/carbon/metrics.module.scss';

const Metric = ({ title, value, unit, type }) => {
    return (
        <motion.div
            className={styles.metricCard}
            whileHover={{
                y: -4,
                transition: { duration: 0.2, ease: "easeOut" }
            }}
        >
            <h3 className={styles.title}>{title}</h3>
            <p className={`${styles.value} ${type ? styles[type] : ''}`}>
                {value}
            </p>
            <p className={styles.unit}>{unit}</p>
        </motion.div>
    );
};

const MetricsGrid = () => {
    const [metrics, setMetrics] = useState([
        { title: 'Total CO₂ Emissions', value: 'N/A', unit: 'tonnes CO₂e' },
        { title: 'Current Month', value: 'N/A', unit: 'tonnes CO₂e' },
        { title: 'YoY Change', value: 'N/A', unit: 'vs last year', type: 'neutral' },
        { title: 'Target Status', value: 'N/A', unit: '2025 goal', type: 'neutral' }
    ]);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const history = await EmissionService.getEmissionHistory();
                const emissions = history.emissions;

                if (emissions && emissions.length > 0) {
                    // Calculate total emissions
                    const totalEmissions = emissions.reduce((sum, e) => sum + e.total_emissions, 0);

                    // Calculate current month emissions
                    const currentDate = new Date();
                    const currentMonthEmissions = emissions.filter(e => {
                        const emissionDate = new Date(e.logged_at);
                        return emissionDate.getMonth() === currentDate.getMonth() &&
                            emissionDate.getFullYear() === currentDate.getFullYear();
                    }).reduce((sum, e) => sum + e.total_emissions, 0);

                    // Calculate YoY change
                    const lastYearEmissions = emissions.filter(e => {
                        const emissionDate = new Date(e.logged_at);
                        return emissionDate.getFullYear() === currentDate.getFullYear() - 1;
                    }).reduce((sum, e) => sum + e.total_emissions, 0);

                    // Prepare metrics with proper N/A handling
                    const updatedMetrics = [
                        {
                            title: 'Total CO₂ Emissions',
                            value: totalEmissions ? (totalEmissions / 1000).toFixed(1) : 'N/A',
                            unit: 'tonnes CO₂e'
                        },
                        {
                            title: 'Current Month',
                            value: currentMonthEmissions ? (currentMonthEmissions / 1000).toFixed(1) : 'N/A',
                            unit: 'tonnes CO₂e'
                        }
                    ];

                    // Only add YoY change if we have last year's data
                    if (lastYearEmissions) {
                        const yoyChange = ((currentMonthEmissions - lastYearEmissions) / lastYearEmissions * 100).toFixed(1);
                        updatedMetrics.push({
                            title: 'YoY Change',
                            value: `${yoyChange}%`,
                            unit: 'vs last year',
                            type: yoyChange < 0 ? 'reduction' : yoyChange > 0 ? 'increase' : 'neutral'
                        });

                        updatedMetrics.push({
                            title: 'Target Status',
                            value: yoyChange < 0 ? 'On Track' : 'Need Action',
                            unit: '2025 goal',
                            type: yoyChange < 0 ? 'onTrack' : 'needAction'
                        });
                    } else {
                        updatedMetrics.push(
                            {
                                title: 'YoY Change',
                                value: 'N/A',
                                unit: 'vs last year',
                                type: 'neutral'
                            },
                            {
                                title: 'Target Status',
                                value: 'N/A',
                                unit: '2025 goal',
                                type: 'neutral'
                            }
                        );
                    }

                    setMetrics(updatedMetrics);
                }
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            }
        };

        fetchMetrics();
    }, []);

    return (
        <motion.div
            className={styles.metricsGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            {
                metrics.map((metric, index) => (
                    <Metric key={index} {...metric} />
                ))
            }
        </motion.div >
    );
};

export default MetricsGrid;
