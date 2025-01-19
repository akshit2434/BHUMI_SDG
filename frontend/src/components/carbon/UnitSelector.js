import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; // Add this import
import 'react-toastify/dist/ReactToastify.css'; // Ensure toast styles are imported
import { FaTimes, FaEdit, FaCheck } from 'react-icons/fa';
import styles from '../../styles/components/carbon/unit-selector.module.scss';
import EmissionService from '../../services/emission.service';
import Loader from '../common/Loader';

const UnitSelector = ({ isOpen, onClose, sourceType, onSelect, currentUnit, metric }) => {
    const [editingRate, setEditingRate] = useState(null);
    const [tempRate, setTempRate] = useState('');
    const [customUnit, setCustomUnit] = useState({ name: '', emission_factor: '' });
    const [units, setUnits] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const response = await EmissionService.getUserUnits();
                setUnits(response);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch units:', error);
                setLoading(false);
            }
        };
        fetchUnits();
    }, []);

    const handleRateEdit = (unit) => {
        // Use the unit name and emission_factor directly from the unit object
        setEditingRate(unit.name);
        setTempRate(unit.emission_factor.toString());
    };

    const handleRateSave = async (e, unitName) => {
        e.preventDefault();  // Add this
        e.stopPropagation(); // Add this

        const newRate = parseFloat(tempRate);
        if (isNaN(newRate)) {
            toast.error('Please enter a valid number');
            return;
        }

        try {
            // Find the unit to update
            const updatedUnits = metric.units.map(u =>
                u.name === unitName ? { ...u, emission_factor: newRate } : u
            );

            // Only update the specific metric's units
            await EmissionService.updateUserUnits({
                [metric.name]: {
                    units: updatedUnits
                }
            });

            // Update local state
            metric.units = updatedUnits;
            setEditingRate(null);
            setTempRate('');
            toast.success('Emission rate updated successfully!');

            // Optional: Trigger a refresh of parent component if needed
            if (onSelect) {
                const updatedUnit = updatedUnits.find(u => u.name === unitName);
                onSelect(updatedUnit);
            }
        } catch (error) {
            console.error('Failed to update unit rate:', error);
            toast.error(error.message || 'Failed to update emission rate');
        }
    };

    const handleAddCustomUnit = async () => {
        if (!customUnit.name || !customUnit.emission_factor) {
            toast.error('Please enter both unit name and emission factor');
            return;
        }

        const newRate = parseFloat(customUnit.emission_factor);
        if (isNaN(newRate)) {
            toast.error('Please enter a valid emission factor');
            return;
        }

        try {
            // Create new unit structure
            const newUnit = {
                name: customUnit.name,
                emission_factor: newRate
            };

            // Add to existing metric units
            const updatedUnits = {
                [metric.name]: {
                    units: [...metric.units, newUnit]
                }
            };

            await EmissionService.updateUserUnits(updatedUnits);

            // Update local state
            metric.units.push(newUnit);

            // Reset form
            setCustomUnit({ name: '', emission_factor: '' });
            toast.success('Custom unit added successfully!');
        } catch (error) {
            console.error('Failed to add custom unit:', error);
            toast.error(error.message || 'Failed to add custom unit');
        }
    };

    const handleOverlayClick = (e) => {
        e.preventDefault();
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleUnitSelect = (unit) => {
        onSelect({
            name: unit.name,
            emission_factor: unit.emission_factor
        });
    };

    if (!isOpen || !metric) return null;

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Select Unit for {sourceType}</h3>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            onClose();
                        }}
                        className={styles.closeBtn}
                    >
                        <FaTimes />
                    </button>
                </div>
                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loaderContainer}>
                            <Loader size="small" text="Loading units..." />
                        </div>
                    ) : (
                        <>
                            <div className={styles.tableHeader}>
                                <span>Unit</span>
                                <span>Emission Rate (kgCO₂e)</span>
                            </div>
                            <div className={styles.unitList}>
                                {metric.units.map(unit => (
                                    <div
                                        key={unit.name}
                                        className={`${styles.unitRow} ${currentUnit === unit.name ? styles.active : ''}`}
                                        onClick={() => handleUnitSelect(unit)}
                                    >
                                        <span className={styles.unitLabel}>{unit.name}</span>
                                        <div className={styles.rateSection}>
                                            {editingRate === unit.name ? (
                                                <div className={styles.rateEdit}>
                                                    <input
                                                        type="number"
                                                        value={tempRate}
                                                        onChange={(e) => setTempRate(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={styles.rateInput}
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRateSave(e, unit.name);
                                                        }}
                                                        className={styles.saveBtn}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span>{unit.emission_factor} kgCO₂e/{unit.name}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRateEdit(unit);
                                                        }}
                                                        className={styles.editBtn}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <div className={styles.addCustomUnit}>
                    <div className={styles.customUnitForm}>
                        <input
                            placeholder="Unit (e.g., MWh)"
                            value={customUnit.name}
                            onChange={e => setCustomUnit(prev => ({
                                ...prev,
                                name: e.target.value
                            }))}
                        />
                        <input
                            type="number"
                            placeholder="Emission Factor (kgCO₂e)"
                            value={customUnit.emission_factor}
                            onChange={e => setCustomUnit(prev => ({
                                ...prev,
                                emission_factor: e.target.value
                            }))}
                        />
                        <button
                            type="button"
                            onClick={handleAddCustomUnit}
                            className={styles.addCustomBtn}
                        >
                            Add Unit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitSelector;