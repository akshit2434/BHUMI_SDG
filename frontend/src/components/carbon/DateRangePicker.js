import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import styles from '../../styles/components/carbon/date-range-picker.module.scss';
import EmissionService from '../../services/emission.service';

function toLocalMidnight(date) {
    if (!date) return null;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return d;
}

function nextDay(date) {
    const d = toLocalMidnight(date);
    d.setDate(d.getDate() + 1);
    return d;
}

function prevDay(date) {
    const d = toLocalMidnight(date);
    d.setDate(d.getDate() - 1);
    return d;
}

function generateHighlightedDates(ranges) {
    const highlights = [];
    ranges.forEach(r => {
        const days = [];
        let d = toLocalMidnight(new Date(r.start));
        while (d <= toLocalMidnight(new Date(r.end))) {
            days.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
        highlights.push({ "logged-range": days });
    });
    return highlights;
}

function isValidNewRange(sortedRanges, start, end) {
    if (!start || !end || sortedRanges.length === 0) return true;

    const startMid = toLocalMidnight(start);
    const endMid = toLocalMidnight(end);
    const firstRangeStart = toLocalMidnight(sortedRanges[0].start);
    const lastRangeEnd = toLocalMidnight(sortedRanges[sortedRanges.length - 1].end);

    // Adjacent before the earliest range
    if (prevDay(firstRangeStart).getTime() === endMid.getTime()) return true;
    // Adjacent after the latest range
    if (nextDay(lastRangeEnd).getTime() === startMid.getTime()) return true;

    // Check filling exact gaps
    for (let i = 0; i < sortedRanges.length - 1; i++) {
        const curEnd = toLocalMidnight(sortedRanges[i].end);
        const nxtStart = toLocalMidnight(sortedRanges[i + 1].start);
        if (nextDay(curEnd).getTime() === startMid.getTime() &&
            prevDay(nxtStart).getTime() === endMid.getTime()) {
            return true;
        }
    }
    return false;
}

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
    const [disabledRanges, setDisabledRanges] = useState([]);
    const [sortedRanges, setSortedRanges] = useState([]);

    useEffect(() => {
        fetchDisabledRanges();
    }, []);

    const fetchDisabledRanges = async () => {
        try {
            const ranges = await EmissionService.getEmissionRanges();
            const formattedRanges = ranges.map(range => ({
                start: new Date(range.start),
                end: new Date(range.end)
            }));

            const sorted = formattedRanges.sort((a, b) => a.start - b.start);
            setDisabledRanges(formattedRanges);
            setSortedRanges(sorted);
        } catch (error) {
            console.error('Failed to fetch disabled ranges:', error);
        }
    };

    const isDateDisabled = (date) => {
        // Strip time to avoid partial day confusion
        const checkDate = toLocalMidnight(date).getTime();
        return disabledRanges.some(range => {
            const rgStart = toLocalMidnight(range.start).getTime();
            const rgEnd = toLocalMidnight(range.end).getTime();
            return checkDate >= rgStart && checkDate <= rgEnd;
        });
    };

    const handleStartDateChange = (date) => {
        if (!date) {
            onStartDateChange('');
            return;
        }

        if (isDateDisabled(date)) {
            toast.error('This date is already included in existing emissions');
            return;
        }

        if (endDate) {
            const start = toLocalMidnight(date);
            const end = toLocalMidnight(new Date(endDate));
            if (!isValidNewRange(sortedRanges, start, end)) {
                toast.warn('Please select a date that creates a continuous timeline with existing logs');
                return;
            }
        }

        // Use toLocaleDateString to avoid timezone shifts
        onStartDateChange(date.toLocaleDateString('en-CA'));
    };

    const handleEndDateChange = (date) => {
        if (!date) {
            onEndDateChange('');
            return;
        }

        if (isDateDisabled(date)) {
            toast.error('This date is already included in existing emissions');
            return;
        }

        if (startDate) {
            const start = toLocalMidnight(new Date(startDate));
            const end = toLocalMidnight(date);
            if (!isValidNewRange(sortedRanges, start, end)) {
                toast.warn('Please select a date that creates a continuous timeline with existing logs');
                return;
            }
        }

        // Use toLocaleDateString to avoid timezone shifts
        onEndDateChange(date.toLocaleDateString('en-CA'));
    };

    const handleClearDates = () => {
        onStartDateChange('');
        onEndDateChange('');
    };

    return (
        <div className={styles.dateRangePicker}>
            <div className={styles.dateField}>
                <label>Start Date</label>
                <DatePicker
                    selected={startDate ? new Date(startDate) : null}
                    onChange={handleStartDateChange}
                    maxDate={new Date()}
                    filterDate={date => !isDateDisabled(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select start date"
                    className={styles.datePicker}
                    required
                    portalId="date-picker-portal"
                    withPortal
                    highlightDates={generateHighlightedDates(disabledRanges)}
                />
            </div>
            <div className={styles.separator}>to</div>
            <div className={styles.dateField}>
                <label>End Date</label>
                <DatePicker
                    selected={endDate ? new Date(endDate) : null}
                    onChange={handleEndDateChange}
                    maxDate={new Date()}
                    minDate={startDate ? new Date(startDate) : null}
                    filterDate={date => !isDateDisabled(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select end date"
                    className={styles.datePicker}
                    required
                    portalId="date-picker-portal"
                    withPortal
                    highlightDates={generateHighlightedDates(disabledRanges)}
                />
            </div>
            <button
                type="button"
                className={styles.clearButton}
                onClick={handleClearDates}
            >
                Clear Dates
            </button>
        </div>
    );
};

export default DateRangePicker;
