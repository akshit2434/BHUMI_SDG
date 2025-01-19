import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import EmissionService from '../services/EmissionService';

const MetricInput = () => {
    console.log('MetricInput component mounted'); // Add this line to verify mounting

    const [metrics, setMetrics] = useState([]);
    const [error, setError] = useState(null);
    const [inputs, setInputs] = useState({});
    const [selectedUnits, setSelectedUnits] = useState({});

    const initializeData = async () => {
        try {
            console.group('MetricInput - Data Initialization');
            console.log('Fetching metrics data...');

            const response = await EmissionService.getUserUnits();
            console.log('Raw Response:', response);

            if (!response?.metrics || !Array.isArray(response.metrics)) {
                throw new Error('Invalid metrics data format received');
            }

            // Log the metrics array to verify structure
            console.log('Metrics Array:', response.metrics);

            // Initialize inputs and selected units based on response data
            const initialInputs = {};
            const initialUnits = {};
            response.metrics.forEach(metric => {  // Changed from metrics to response.metrics
                if (metric && metric.name && metric.units && metric.units.length > 0) {
                    initialInputs[metric.name] = '';
                    initialUnits[metric.name] = metric.units[0].name;
                }
            });

            console.log('Initial Inputs:', initialInputs);
            console.log('Initial Units:', initialUnits);

            // Set all states after processing
            setMetrics(response.metrics);
            setInputs(initialInputs);
            setSelectedUnits(initialUnits);

            console.groupEnd();

        } catch (error) {
            console.error('Failed to initialize data:', error);
            setError('Failed to load metrics');
        }
    };

    const hasInitialized = useRef(false); // Added useRef

    useEffect(() => {
        console.log('MetricInput useEffect triggered'); // Add this line
        if (!hasInitialized.current) { // Check if already initialized
            console.log('Initializing data...'); // Add this line
            initializeData();
            hasInitialized.current = true; // Set to true after initialization
        }
    }, []);

    const handleInputChange = (metricName, value) => {
        setInputs(prev => ({
            ...prev,
            [metricName]: value
        }));
    };

    const handleUnitChange = (metricName, unit) => {
        setSelectedUnits(prev => ({
            ...prev,
            [metricName]: unit
        }));
    };

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {metrics.length === 0 && <div>Loading metrics...</div>}
            {metrics.map((metric) => (
                <div key={metric.name} className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        {metric.name.charAt(0).toUpperCase() + metric.name.slice(1)}
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Value
                            </label>
                            <input
                                type="number"
                                value={inputs[metric.name] || ''}
                                onChange={(e) => handleInputChange(metric.name, e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Enter ${metric.name} value`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit
                            </label>
                            <select
                                value={selectedUnits[metric.name] || ''}
                                onChange={(e) => handleUnitChange(metric.name, e.target.value)}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {metric.units.map(unit => (
                                    <option key={unit.name} value={unit.name}>
                                        {unit.name} ({unit.emission_factor} kgCO2e/{unit.name})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MetricInput;
