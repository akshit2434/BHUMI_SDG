import React from 'react';
import { FaTrash, FaEdit, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import styles from '../../../styles/components/carbon/goals/goalCard.module.scss';
const GoalCard = ({ goal, progress = {}, onEdit, onDelete }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date instanceof Date && !isNaN(date) ? date.getFullYear() : '';
        } catch {
            return '';
        }
    };

    const getTimeProgress = (goal) => {
        if (!goal.start_date || !goal.end_date) return 0;
        const start = new Date(goal.start_date);
        const end = new Date(goal.end_date);
        const now = new Date();
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
        const total = end - start;
        const elapsed = now - start;
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    };

    const formatReduction = (reduction) => {
        const value = parseFloat(reduction);
        if (isNaN(value)) return '0%';
        const formatted = Math.abs(value).toFixed(1);
        return `${value < 0 ? '+' : '-'}${formatted}%`;
    };

    const timeProgress = getTimeProgress(goal);
    const isCompleted = new Date(goal.end_date) < new Date();
    const isNotStarted = progress.notStarted;
    const hasNoData = progress.noData;

    const getStatusLabel = () => {
        if (isCompleted) {
            const targetMet = parseFloat(progress.reduction) >= parseFloat(goal.target_reduction);
            return {
                text: targetMet ? '(Target Achieved)' : '(Target Not Met)',
                className: targetMet ? styles.completedSuccess : styles.completedFailed
            };
        }
        if (hasNoData) return { text: '(No Data)', className: styles.behindLabel };
        if (progress.onTrack) return { text: '(On Track)', className: styles.onTrackLabel };
        if (progress.slightlyBehind) return { text: '(Slightly Behind)', className: styles.warningLabel };
        return { text: '(Behind Schedule)', className: styles.behindLabel };
    };

    const getCardStatusClass = () => {
        if (isCompleted) {
            return parseFloat(progress.reduction) >= parseFloat(goal.target_reduction)
                ? styles.achievedGoal
                : styles.missedGoal;
        }
        if (isNotStarted) return styles.notStartedGoal;
        if (hasNoData) return styles.noDataGoal;
        if (progress.slightlyBehind) return styles.warningGoal;
        return progress.onTrack ? styles.onTrackGoal : styles.behindGoal;
    };

    const status = getStatusLabel();

    return (
        <div className={`${styles.goalCard} ${getCardStatusClass()}`}>
            <div className={styles.goalHeader}>
                <div className={styles.headerMain}>
                    <h3>{goal.title}</h3>
                    {isCompleted && <span className={styles.completedTag}>COMPLETED</span>}
                </div>
                <div className={styles.actions}>
                    <button onClick={onEdit}><FaEdit /></button>
                    <button onClick={onDelete}><FaTrash /></button>
                </div>
            </div>
            <div className={styles.goalDetails}>
                <p>Target: {goal.target_reduction?.toFixed(1) || 0}% reduction by {formatDate(goal.end_date) || 'N/A'}</p>
                <p>Baseline: {goal.baseline?.toFixed(2) || 0} tCO₂e ({formatDate(goal.baseline_start_date) || 'N/A'} - {formatDate(goal.baseline_end_date) || 'N/A'})</p>
                <p className={`${styles.currentReduction} ${parseFloat(progress.reduction) < 0 ? styles.negative : styles.positive}`}>
                    Current Reduction: {
                        isNotStarted ? 'Goal period not started' :
                            hasNoData ? 'No data available' :
                                <>
                                    {formatReduction(progress.reduction)}
                                    {!isNotStarted && !hasNoData && (
                                        parseFloat(progress.reduction) < 0 ?
                                            <FaArrowUp className={styles.increaseIcon} /> :
                                            <FaArrowDown className={styles.decreaseIcon} />
                                    )}
                                </>
                    }
                </p>

                <div className={styles.progressBars}>
                    <div className={styles.progressBar}>
                        <div
                            className={`${styles.progress} ${isCompleted ?
                                (parseFloat(progress.reduction) >= parseFloat(goal.target_reduction) ?
                                    styles.completed : styles.failed) :
                                isNotStarted ?
                                    styles.notStarted :
                                    (progress.onTrack ? styles.onTrack : styles.behind)
                                }`}
                            style={{ width: `${progress.progress}%` }}
                        />
                        <span>{isNotStarted ? 'Not started' : `${progress.progress}% of target`}</span>
                    </div>
                    <div className={styles.timeProgress}>
                        <div
                            className={styles.progress}
                            style={{ width: `${timeProgress}%` }}
                        />
                        <span>{timeProgress.toFixed(0)}% time elapsed</span>
                    </div>
                </div>

                {!isNotStarted && progress.currentEmissions !== undefined && (
                    <p className={styles.currentEmissions}>
                        Current: {parseFloat(progress.currentEmissions || 0).toFixed(2)} tCO₂e
                        <span className={status.className}>
                            {status.text}
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
};

export default GoalCard;
