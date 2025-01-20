import React, { useState } from 'react';
import Sidenav from '../../components/bhumi/Sidenav';
import ProductList from '../../components/bhumi/ProductList';
import BrowseProducts from '../../components/bhumi/BrowseProducts';
import AddProduct from '../../components/bhumi/AddProduct';
import styles from '../../styles/pages/bhumi/dashboard.module.scss';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('buy');

    const renderContent = () => {
        switch (activeTab) {
            case 'buy':
                return <BrowseProducts />;
            case 'sell':
                return <AddProduct />;
            case 'orders':
                return <div>Orders Content</div>;
            case 'listings':
                return <ProductList />;
            case 'settings':
                return <div>Settings Content</div>;
            default:
                return <BrowseProducts />;
        }
    };

    return (
        <div className={styles.container}>
            <Sidenav activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className={styles.content}>
                {renderContent()}
            </main>
        </div>
    );
};

export default Dashboard;