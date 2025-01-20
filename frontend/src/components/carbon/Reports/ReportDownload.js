import React, { useState } from 'react';
import { downloadReport } from '../../../services/report.service';
import styles from '../../../styles/components/carbon/reports/reportDownload.module.scss';

const ReportDownload = ({ reportId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDownload = async () => {
        if (!reportId) {
            setError('Invalid report ID');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await downloadReport(reportId);

            // Create blob from response
            const blob = new Blob([response.data], { type: 'application/pdf' });

            // Create URL for blob
            const url = window.URL.createObjectURL(blob);

            // Create temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `emission-report-${reportId}.pdf`);

            // Append to document, click, and clean up
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Release the blob URL
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading report:', err);
            setError(err.response?.data?.error || 'Failed to download report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {error && <div className={styles.error}>{error}</div>}
            <button
                onClick={handleDownload}
                disabled={loading || !reportId}
                className={styles.downloadButton}
            >
                {loading ? (
                    <span className={styles.loadingText}>
                        Preparing Download
                    </span>
                ) : (
                    <span className={styles.buttonText}>
                        Download PDF Report
                    </span>
                )}
            </button>
        </div>
    );
};

export default ReportDownload;