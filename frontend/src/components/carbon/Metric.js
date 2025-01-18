import React from 'react';
import styles from '../../styles/components/carbon/metrics.module.scss';

const Metric = ({ title, value, unit, type }) => {
    return (
        <div className={styles.metricCard}>
            <h3 className={styles.title}>{title}</h3>
            <p className={`${styles.value} ${type ? styles[type] : ''}`}>
                {value}
            </p>
            <p className={styles.unit}>{unit}</p>
        </div>
    );
};

const MetricsGrid = () => {
    const metrics = [
        { title: 'Total CO₂ Emissions', value: '245.8', unit: 'tonnes CO₂e' },
        { title: 'Current Month', value: '18.3', unit: 'tonnes CO₂e' },
        { title: 'YoY Change', value: '-12.4%', unit: 'vs last year', type: 'reduction' },
        { title: 'Target Status', value: 'On Track', unit: '2024 goal', type: 'onTrack' }
    ];

    return (
        <div className={styles.metricsGrid}>
            {metrics.map((metric, index) => (
                <Metric key={index} {...metric} />
            ))}
        </div>
    );
};

export default MetricsGrid;
