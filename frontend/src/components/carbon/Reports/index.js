import React, { useState } from 'react';
import ReportSelector from './ReportSelector';
import ReportVisualization from './ReportVisualization';
import ReportDownload from './ReportDownload';
import { generateReport } from '../../../services/report.service';
import styles from '../../../styles/components/carbon/reports/index.module.scss';

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [reportId, setReportId] = useState(null);

    const handleReportGenerate = async (selectedLogs) => {
        setLoading(true);
        setError(null);
        setReportData(null);
        setReportId(null);

        try {
            const response = await generateReport(selectedLogs);
            if (!response.data) {
                throw new Error('No data received from server');
            }

            const { reportData: data, reportId: id } = response.data;

            if (!data) {
                throw new Error('Invalid report data format');
            }

            setReportData(data);
            if (id) {
                setReportId(id);
            }
        } catch (err) {
            console.error('Error generating report:', err);
            setError(err.response?.data?.error || err.message || 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (error) {
            return (
                <div className={styles.error}>
                    {error}
                </div>
            );
        }

        if (loading) {
            return (
                <div className={styles.loading}>
                    Generating your report...
                </div>
            );
        }

        return (
            <>
                {reportData && (
                    <div className={styles.reportContent}>
                        <ReportVisualization reportData={reportData} />
                        {reportId && <ReportDownload reportId={reportId} />}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <ReportSelector onGenerate={handleReportGenerate} />
                {renderContent()}
            </div>
        </div>
    );
};

export default Reports;