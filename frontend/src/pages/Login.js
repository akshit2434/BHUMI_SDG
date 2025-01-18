import React, { useState } from 'react';
import AuthService from '../services/auth.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/pages/Login.scss';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [userDetails, setUserDetails] = useState({
        full_name: '',
        phone: '',
        organization: ''
    });
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Logging in...');

        try {
            const response = await AuthService.login(email, password);
            if (response.needs_details) {
                setShowDetails(true);
                toast.update(toastId, {
                    render: 'Please fill in your details',
                    type: 'info',
                    isLoading: false,
                    autoClose: 2000
                });
            } else {
                toast.update(toastId, {
                    render: response.message || 'Login successful!',
                    type: 'success',
                    isLoading: false,
                    autoClose: 2000
                });
                const from = location.state?.from?.pathname || '/';
                setTimeout(() => navigate(from), 1500);
            }
        } catch (error) {
            toast.update(toastId, {
                render: error.message || 'Authentication failed',
                type: 'error',
                isLoading: false,
                autoClose: 3000
            });
            setPassword(''); // Clear password on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleDetailsSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Updating details...');

        try {
            await AuthService.updateUserDetails(userDetails);
            toast.update(toastId, {
                render: 'Details updated successfully!',
                type: 'success',
                isLoading: false,
                autoClose: 2000
            });
            const from = location.state?.from?.pathname || '/';
            setTimeout(() => navigate(from), 1500);
        } catch (error) {
            toast.update(toastId, {
                render: error.message || 'Error updating details',
                type: 'error',
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    return (
        <div className="login-container">
            <div className="floating-card">
                <h1 className="login-title">{showDetails ? 'Complete Profile' : 'Login'}</h1>
                {!showDetails ? (
                    <form onSubmit={handleLogin} className="login-form" autoComplete="off">
                        <div className="form-group">
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Email address"
                                autoComplete="new-email"
                                spellCheck="false"
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Password"
                                autoComplete="new-password"
                            />
                        </div>
                        <button
                            type="submit"
                            className={`submit-button ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? <span className="loading-spinner"></span> : 'Continue'}
                        </button>
                        <p className="info-text">
                            Don't have an account? Just enter your details and we'll create one for you!
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleDetailsSubmit} className="login-form">
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                value={userDetails.full_name}
                                onChange={(e) => setUserDetails({ ...userDetails, full_name: e.target.value })}
                                required
                                placeholder="Full Name"
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="tel"
                                className="form-input"
                                value={userDetails.phone}
                                onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                                required
                                placeholder="Phone Number"
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                value={userDetails.organization}
                                onChange={(e) => setUserDetails({ ...userDetails, organization: e.target.value })}
                                required
                                placeholder="Organization"
                            />
                        </div>
                        <button type="submit" className="submit-button">
                            Complete Profile
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
