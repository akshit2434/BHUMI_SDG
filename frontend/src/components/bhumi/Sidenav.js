
import React from 'react';
import { FaStore, FaShoppingCart, FaIndustry, FaHistory, FaCog, FaSignOutAlt, FaPlus, FaList } from 'react-icons/fa';
import AuthService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from '../../styles/components/bhumi/sidenav.module.scss';

const Sidenav = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate();
    const sidebarItems = [
        { id: 'buy', label: 'Buy Byproducts', icon: <FaStore /> },
        { id: 'sell', label: 'Sell Byproducts', icon: <FaPlus /> },
        { id: 'orders', label: 'Orders', icon: <FaShoppingCart /> },
        { id: 'listings', label: 'My Listings', icon: <FaList /> },
        // { id: 'settings', label: 'Settings', icon: <FaCog /> }
    ];

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
    };

    return (
        <motion.nav
            className={styles.sidebar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.logo}>
                <FaStore />
                <span>bhumi</span>
            </div>
            <ul className={styles.navList}>
                {sidebarItems.map((item) => (
                    <motion.li
                        key={item.id}
                        className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                        onClick={() => setActiveTab(item.id)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </motion.li>
                ))}
            </ul>
            <div className={styles.bottomSection}>
                <motion.button
                    className={styles.carbonBtn}
                    onClick={() => {
                        window.location.href = '/carbon';
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <FaIndustry />
                    <span>CarbonTrack</span>
                </motion.button>
                <motion.button
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <FaSignOutAlt />
                    <span>Logout</span>
                </motion.button>
            </div>
        </motion.nav>
    );
};

export default Sidenav;