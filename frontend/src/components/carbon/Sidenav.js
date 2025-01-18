import React from 'react';
import { FaIndustry, FaChartLine, FaFileAlt, FaUsers, FaCog, FaSignOutAlt } from 'react-icons/fa';
import AuthService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/components/carbon/sidenav.module.scss';

const Sidenav = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate();
    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
        { id: 'emissions', label: 'Emissions Log', icon: <FaIndustry /> },
        { id: 'reports', label: 'Reports', icon: <FaFileAlt /> },
        { id: 'team', label: 'Team', icon: <FaUsers /> },
        { id: 'settings', label: 'Settings', icon: <FaCog /> }
    ];

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
    };

    return (
        <nav className={styles.sidebar}>
            <div className={styles.logo}>
                <FaIndustry />
                <span>CarbonTrack</span>
            </div>
            <div className={styles.userInfo}>
                <div className={styles.avatar}></div>
                <span>Welcome, Admin</span>
            </div>
            <ul className={styles.navList}>
                {sidebarItems.map(item => (
                    <li
                        key={item.id}
                        className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </li>
                ))}
            </ul>
            <button className={styles.logoutBtn} onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Logout</span>
            </button>
        </nav>
    );
};

export default Sidenav;
