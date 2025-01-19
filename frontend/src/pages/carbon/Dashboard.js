import React, { useState } from 'react';
import Sidenav from '../../components/carbon/Sidenav';
import MetricsGrid from '../../components/carbon/Metric';
import MetricInput from '../../components/carbon/MetricInput';
import EmissionHistory from '../../components/carbon/EmissionHistory';
import styles from '../../styles/components/carbon/dashboard.module.scss';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleEmissionSubmit = async (response) => {
        try {
            // Trigger a refresh by updating the refreshKey
            setRefreshKey(oldKey => oldKey + 1);
        } catch (error) {
            console.error('Error handling emission submission:', error);
        }
    };

    const handleMetricEdit = async (response) => {
        try {
            setRefreshKey(oldKey => oldKey + 1);
        } catch (error) {
            console.error('Error handling metric edit:', error);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div key={refreshKey} className={styles.dashboardContent}>
                        <MetricsGrid />
                        <MetricInput onSubmit={handleEmissionSubmit} onEdit={handleMetricEdit} />
                    </div>
                );
            case 'emissions':
                return <EmissionHistory />;
            case 'reports':
                return <div>Reports</div>;
            default:
                return <div>Section under development</div>;
        }
    };

    return (
        <div className={styles.container}>
            <Sidenav activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                </header>
                {renderContent()}
            </main>
        </div>
    );
};

export default Dashboard;
