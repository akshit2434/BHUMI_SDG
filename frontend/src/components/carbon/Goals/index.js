import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import styles from '../../../styles/components/carbon/goals/index.module.scss';
import GoalsService from '../../../services/goals.service';
import GoalCard from './GoalCard';
import GoalFormModal from './GoalFormModal';

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [goalProgress, setGoalProgress] = useState({});

    const fetchGoals = useCallback(async () => {
        try {
            setLoading(true);
            const goalsData = await GoalsService.getGoals();
            if (Array.isArray(goalsData)) {
                setGoals(goalsData);
            } else {
                console.error('Invalid goals data format:', goalsData);
                setGoals([]);
            }
        } catch (error) {
            console.error('Fetch goals error:', error);
            toast.error(error.message || 'Failed to fetch goals');
            setGoals([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        const getGoals = async () => {
            if (mounted) {
                await fetchGoals();
            }
        };
        getGoals();
        return () => {
            mounted = false;
        };
    }, [fetchGoals]);

    useEffect(() => {
        const updateProgress = async () => {
            const progressData = {};
            for (const goal of goals) {
                if (goal && goal._id) {
                    progressData[goal._id] = await GoalsService.calculateGoalProgress(goal);
                }
            }
            setGoalProgress(progressData);
        };

        if (goals.length > 0) {
            updateProgress();
        }
    }, [goals]);

    const handleDelete = async (goalId) => {
        if (!goalId) {
            toast.error('Invalid goal ID');
            return;
        }

        if (window.confirm('Are you sure you want to delete this goal?')) {
            try {
                await GoalsService.deleteGoal(goalId);
                toast.success('Goal deleted successfully');
                fetchGoals();
            } catch (error) {
                toast.error(error.message || 'Failed to delete goal');
            }
        }
    };

    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setShowModal(true);
    };

    return (
        <div className={styles.goalsContainer}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Emission Reduction Goals</h1>
                    <button
                        className={styles.addButton}
                        onClick={() => {
                            setEditingGoal(null);
                            setShowModal(true);
                        }}
                    >
                        <FaPlus /> Add Goal
                    </button>
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading goals...</div>
            ) : (
                <div className={styles.goalsGrid}>
                    {goals.length === 0 ? (
                        <div className={styles.noGoals}>
                            No goals set yet. Click "Add Goal" to create your first goal.
                        </div>
                    ) : (
                        goals.map(goal => (
                            <GoalCard
                                key={goal._id}
                                goal={goal}
                                progress={goalProgress[goal._id]}
                                onEdit={() => handleEdit(goal)}
                                onDelete={() => handleDelete(goal._id)}
                            />
                        ))
                    )}
                </div>
            )}

            <GoalFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                editingGoal={editingGoal}
                onSubmitSuccess={fetchGoals}
            />
        </div>
    );
};

export default Goals;
