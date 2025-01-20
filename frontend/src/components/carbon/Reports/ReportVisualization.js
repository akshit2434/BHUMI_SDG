import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';
import styles from '../../../styles/components/carbon/reports/reportVisualization.module.scss';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

const ReportVisualization = ({ reportData }) => {
    if (!reportData) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return format(date, 'MMM d, yyyy');
    };

    const formatDateRange = (startDate, endDate) => {
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    };

    const formatEmissionValue = (value) => {
        if (typeof value !== 'number') return '0 kg CO₂e';

        // Convert to tons if value is over 1000 kg
        if (value >= 1000) {
            return `${(value / 1000).toFixed(2)} tons CO₂e`;
        }
        return `${value.toFixed(2)} kg CO₂e`;
    };

    const processChartData = () => {
        const datasets = [];

        if (reportData.selectedLogData) {
            datasets.push({
                label: formatDateRange(
                    reportData.selectedLogData.start_date,
                    reportData.selectedLogData.end_date
                ),
                data: reportData.selectedLogData.values.map(point => ({
                    x: new Date(point.date),
                    y: point.value
                })).sort((a, b) => a.x - b.x),
                borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--color-primary').trim(),
                backgroundColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--color-primary-light').trim(),
                tension: 0.4,
                fill: false
            });
        }

        if (reportData.comparisonData) {
            datasets.push({
                label: reportData.comparisonType === 'baseline'
                    ? 'Baseline'
                    : formatDateRange(
                        reportData.comparisonData.start_date,
                        reportData.comparisonData.end_date
                    ),
                data: reportData.comparisonData.values.map(point => ({
                    x: new Date(point.date),
                    y: point.value
                })).sort((a, b) => a.x - b.x),
                borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--color-warning').trim(),
                backgroundColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--color-warning-light').trim(),
                tension: 0.4,
                fill: false
            });
        }

        return { datasets };
    };

    const chartOptions = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    displayFormats: {
                        day: 'MMM d, yyyy'
                    }
                },
                title: {
                    display: true,
                    text: 'Date'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Carbon Emissions (kg CO₂e)'
                },
                ticks: {
                    callback: function (value) {
                        return formatEmissionValue(value);
                    }
                }
            }
        },
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Carbon Emission Comparison'
            },
            tooltip: {
                callbacks: {
                    title: (context) => {
                        if (context[0]) {
                            const date = new Date(context[0].parsed.x);
                            return format(date, 'MMMM d, yyyy');
                        }
                        return '';
                    },
                    label: (context) => {
                        return `${context.dataset.label}: ${formatEmissionValue(context.parsed.y)}`;
                    }
                }
            }
        }
    };

    const renderSummary = () => {
        if (!reportData.summary) return null;

        const { summary } = reportData;
        const getChangeClass = (value) => {
            if (value > 0) return styles.negative;
            if (value < 0) return styles.positive;
            return '';
        };

        return (
            <div className={styles.summary}>
                <h3 className={styles.summaryTitle}>Analysis Summary</h3>
                <div className={styles.summaryGrid}>
                    {summary.average && (
                        <div className={styles.summaryItem}>
                            <span className={styles.label}>Average Emissions</span>
                            <span className={styles.value}>
                                {formatEmissionValue(summary.average)}
                            </span>
                        </div>
                    )}
                    {summary.peak && (
                        <div className={styles.summaryItem}>
                            <span className={styles.label}>Peak Value</span>
                            <span className={styles.value}>
                                {formatEmissionValue(summary.peak)}
                            </span>
                        </div>
                    )}
                    {summary.change != null && (
                        <div className={styles.summaryItem}>
                            <span className={styles.label}>Change</span>
                            <span className={`${styles.value} ${getChangeClass(summary.change)}`}>
                                {summary.change > 0 ? '+' : ''}{summary.change.toFixed(2)}%
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderSuggestions = () => {
        if (!reportData.suggestions?.length) return null;

        return (
            <div className={styles.suggestionsContainer}>
                <div className={styles.suggestionsHeader}>
                    <h3 className={styles.suggestionsTitle}>AI Suggestions</h3>
                    {reportData.suggestions.map((suggestion, index) => (
                        <div key={index} className={styles.suggestionItem}>
                            <div className={styles.suggestionHeader}>
                                <span className={styles.suggestionNumber}>{index + 1}.</span>
                            </div>
                            <div className={styles.suggestionText}>
                                {suggestion}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.chartContainer}>
                <Line data={processChartData()} options={chartOptions} />
            </div>
            {renderSummary()}
            {renderSuggestions()}
        </div>
    );
};

export default ReportVisualization;