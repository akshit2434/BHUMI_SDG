import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiTest = () => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    console.log('API URL:', process.env.REACT_APP_API_URL); // Debug log

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(''); // Clear any previous errors
                const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                const response = await axios.get(`${baseUrl}/test`, {
                    withCredentials: true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                setMessage(response.data.message);
            } catch (err) {
                setMessage(''); // Clear any previous message
                setError(`Error fetching data: ${err.message}`);
                console.error('API Error:', err);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            {message && <p>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default ApiTest;
