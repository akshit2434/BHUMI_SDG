import React from 'react';
import '../styles/components/RegisterConfirm.scss';

const RegisterConfirm = ({ email, onConfirm, onCancel }) => {
    return (
        <div className="register-confirm">
            <h2>Account Not Found</h2>
            <p>No account exists for {email}</p>
            <p>Would you like to create a new account?</p>
            <div className="button-group">
                <button onClick={onConfirm} className="btn-confirm">
                    Create Account
                </button>
                <button onClick={onCancel} className="btn-cancel">
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default RegisterConfirm;
