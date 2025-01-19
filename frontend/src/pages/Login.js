import React, { useState, useEffect } from 'react';
import AuthService from '../services/auth.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import RegisterConfirm from '../components/RegisterConfirm';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/pages/Login.scss';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
    const [userDetails, setUserDetails] = useState({
        full_name: '',
        phone: '',
        organization: '',
        industry: 'Manufacturing', // default value
        new_password: '',
        confirm_password: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const isAuth = await AuthService.isAuthenticated();
                if (isAuth) {
                    navigate('/');
                }
            } catch (error) {
                // If auth check fails, clear any invalid tokens
                AuthService.logout();
            }
        };

        checkAuth();
    }, [navigate]);

    const validatePassword = (password) => {
        const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!regex.test(password)) {
            return "Password must be at least 8 characters long and contain both letters and numbers";
        }
        return "";
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setUserDetails({ ...userDetails, new_password: newPassword });
        setPasswordError(validatePassword(newPassword));
        setPasswordsMatch(newPassword === userDetails.confirm_password);
    };

    const handleConfirmPasswordChange = (e) => {
        const confirmPassword = e.target.value;
        setUserDetails({ ...userDetails, confirm_password: confirmPassword });
        setPasswordsMatch(userDetails.new_password === confirmPassword);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Checking credentials...');

        try {
            const checkResult = await AuthService.checkAccount(email);

            if (checkResult.exists) {
                // Account exists, proceed with login
                const response = await AuthService.login(email, password);
                if (response.needs_details) {
                    setShowDetails(true);
                } else {
                    const from = location.state?.from?.pathname || '/';
                    navigate(from);
                }
                toast.update(toastId, {
                    render: response.message,
                    type: 'success',
                    isLoading: false,
                    autoClose: 2000
                });
            } else {
                // Show registration confirmation
                toast.dismiss(toastId);
                setShowRegisterConfirm(true);
            }
        } catch (error) {
            toast.update(toastId, {
                render: error.message,
                type: 'error',
                isLoading: false,
                autoClose: 3000
            });
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegistrationConfirm = async () => {
        setShowRegisterConfirm(false);
        const toastId = toast.loading('Preparing registration...');

        try {
            await AuthService.register(email);
            toast.update(toastId, {
                render: 'Please complete your profile',
                type: 'success',
                isLoading: false,
                autoClose: 2000
            });
            setShowDetails(true);
        } catch (error) {
            toast.update(toastId, {
                render: error.message,
                type: 'error',
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    const handleDetailsSubmit = async (e) => {
        e.preventDefault();

        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        if (!passwordsMatch) {
            toast.error("Passwords don't match");
            return;
        }

        const toastId = toast.loading('Creating your account...');

        try {
            // Add logging to debug the payload
            console.log('Sending user details:', {
                ...userDetails,
                email,
                password: userDetails.new_password
            });

            await AuthService.completeRegistration({
                full_name: userDetails.full_name,
                phone: userDetails.phone,
                organization: userDetails.organization,
                industry: userDetails.industry,
                email: email,
                password: userDetails.new_password
            });

            toast.update(toastId, {
                render: 'Account created successfully!',
                type: 'success',
                isLoading: false,
                autoClose: 2000
            });

            const from = location.state?.from?.pathname || '/';
            setTimeout(() => navigate(from), 1500);
        } catch (error) {
            console.error('Registration error:', error);
            toast.update(toastId, {
                render: error.message || 'Error creating account',
                type: 'error',
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    if (showRegisterConfirm) {
        return (
            <div className="login-container">
                <div className="floating-card">
                    <RegisterConfirm
                        email={email}
                        onConfirm={handleRegistrationConfirm}
                        onCancel={() => {
                            setShowRegisterConfirm(false);
                            setPassword('');
                        }}
                    />
                </div>
            </div>
        );
    }

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
                        <div className="form-group">
                            <select
                                className="form-input"
                                value={userDetails.industry}
                                onChange={(e) => setUserDetails({ ...userDetails, industry: e.target.value })}
                                required
                            >
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Agriculture">Agriculture</option>
                                <option value="Textile">Textile</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                className={`form-input ${passwordError ? 'error' : ''}`}
                                value={userDetails.new_password}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Enter Password"
                            />
                            {passwordError && <span className="error-text">{passwordError}</span>}
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                className={`form-input ${!passwordsMatch ? 'error' : ''}`}
                                value={userDetails.confirm_password}
                                onChange={handleConfirmPasswordChange}
                                required
                                placeholder="Confirm Password"
                            />
                            {!passwordsMatch && (
                                <span className="error-text">Passwords don't match</span>
                            )}
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
