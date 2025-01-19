import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../styles/components/common/loader.module.scss';

const Loader = ({ size = 'medium', overlay = false, text = null }) => {
    const sizeClass = styles[size] || styles.medium;

    if (overlay) {
        return (
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <motion.div
                        className={`${styles.loader} ${sizeClass}`}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    {text && <p className={styles.text}>{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <motion.div
                className={`${styles.loader} ${sizeClass}`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
};

export default Loader;
