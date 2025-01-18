import React, { useState } from 'react';
import Sidenav from '../../components/carbon/Sidenav';
import MetricsGrid from '../../components/carbon/Metric';
import MetricInput from '../../components/carbon/MetricInput';
import styles from '../../styles/components/carbon/dashboard.module.scss';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const handleEmissionSubmit = async (data) => {
        // TODO: Implement API call
        console.log('Emission data:', data);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated delay
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className={styles.dashboardContent}>
                        <MetricsGrid />
                        <MetricInput onSubmit={handleEmissionSubmit} />
                    </div>
                );
            case 'emissions':
                return <div>Emissions Log</div>;
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
