import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/reports`;

export const generateReport = (selectedLogs) => {
    return axios.post(`${API_URL}/generate`, { logs: selectedLogs }, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
    });
};

// export const regenerateReport = (reportId) => {
//     return axios.post(`${API_URL}/regenerate/${reportId}`, {}, {
//         headers: {
//             'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//         },
//     });
// };

export const downloadReport = (reportId) => {
    return axios.get(`${API_URL}/download/${reportId}`, {
        responseType: 'blob',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
    });
};
