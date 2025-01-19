import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import styles from '../../styles/components/carbon/metric-input.module.scss';

const EditMetricModal = ({ isOpen, onClose, title, onSave, onDelete }) => {
    const [newTitle, setNewTitle] = useState(title);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.editModalBackdrop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.editModal}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h4>Edit Metric</h4>
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className={styles.modalInput}
                        />
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.saveBtn}
                                onClick={() => {
                                    onSave(newTitle);
                                    onClose();
                                }}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={() => {
                                    onDelete();
                                    onClose();
                                }}
                            >
                                Delete
                            </button>
                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default EditMetricModal;
