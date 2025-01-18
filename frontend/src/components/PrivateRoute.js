import { Navigate } from 'react-router-dom';
import AuthService from '../services/auth.service';

const PrivateRoute = ({ children }) => {
    if (!AuthService.isAuthenticated()) {
        return <Navigate to="/login" />;
    }
    return children;
};

export default PrivateRoute;
