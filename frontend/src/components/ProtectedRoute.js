import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '../services/auth.service';

const ProtectedRoute = ({ children }) => {
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const isAuth = await AuthService.isAuthenticated();
                setIsVerified(isAuth);
            } catch (error) {
                console.error('Auth verification failed:', error);
                setIsVerified(false);
                AuthService.logout();
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isVerified) {
        // Save the attempted location for redirect after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
