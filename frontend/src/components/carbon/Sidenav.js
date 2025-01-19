import React from 'react';
import { FaIndustry, FaChartLine, FaFileAlt, FaUsers, FaCog, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import AuthService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from '../../styles/components/carbon/sidenav.module.scss';

const Sidenav = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate();
    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
        { id: 'log', label: 'Log Emissions', icon: <FaPlus /> },
        { id: 'emissions', label: 'History', icon: <FaIndustry /> },
        { id: 'goals', label: 'Goals', icon: <FaPlus /> },
        { id: 'reports', label: 'Reports', icon: <FaFileAlt /> },
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
                <FaIndustry />
                <span>CarbonTrack</span>
            </div>
            {/* <div className={styles.userInfo}>
                <div className={styles.avatar}></div>
                <span>Welcome, Admin</span>
            </div> */}
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
            <motion.button
                className={styles.logoutBtn}
                onClick={handleLogout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <FaSignOutAlt />
                <span>Logout</span>
            </motion.button>
        </motion.nav>
    );
};

export default Sidenav;
