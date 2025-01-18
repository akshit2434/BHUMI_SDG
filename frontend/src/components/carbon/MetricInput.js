import React from 'react';
import { toast } from 'react-toastify';
import styles from '../../styles/components/carbon/metric-input.module.scss';

const InputCard = ({ title, unit, hint, value, onChange, name }) => (
    <div className={styles.inputCard}>
        <h4 className={styles.cardTitle}>{title}</h4>
        <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={unit}
            className={styles.input}
        />
        <p className={styles.hint}>{hint}</p>
    </div>
);

const MetricInput = ({ onSubmit }) => {
    const [inputs, setInputs] = React.useState({
        electricity: '',
        gas: '',
        fuel: '',
        waste: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Calculating emissions...');

        try {
            await onSubmit(inputs);
            toast.update(toastId, {
                render: 'Emissions logged successfully!',
                type: 'success',
                isLoading: false,
                autoClose: 2000
            });
            setInputs({ electricity: '', gas: '', fuel: '', waste: '' });
        } catch (error) {
            toast.update(toastId, {
                render: error.message || 'Failed to log emissions',
                type: 'error',
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.section}>
            <h3 className={styles.title}>Log New Emissions</h3>
            <div className={styles.grid}>
                <InputCard
                    title="Electricity Usage"
                    unit="kWh"
                    hint="Total monthly consumption"
                    name="electricity"
                    value={inputs.electricity}
                    onChange={handleChange}
                />
                <InputCard
                    title="Natural Gas"
                    unit="m³"
                    hint="Monthly gas usage"
                    name="gas"
                    value={inputs.gas}
                    onChange={handleChange}
                />
                <InputCard
                    title="Vehicle Fleet"
                    unit="Liters"
                    hint="Fuel consumption"
                    name="fuel"
                    value={inputs.fuel}
                    onChange={handleChange}
                />
                <InputCard
                    title="Waste Management"
                    unit="kg"
                    hint="Total waste generated"
                    name="waste"
                    value={inputs.waste}
                    onChange={handleChange}
                />
            </div>
            <button type="submit" className={styles.submitButton}>
                Calculate & Log Emissions
            </button>
        </form>
    );
};

export default MetricInput;
