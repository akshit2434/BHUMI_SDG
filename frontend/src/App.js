import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ApiTest from './components/ApiTest';
import PrivateRoute from './components/PrivateRoute';
import './styles/globals.scss'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/carbon/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/carbon" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/carbon/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test"
            element={
              <PrivateRoute>
                <ApiTest />
              </PrivateRoute>
            }
          />
        </Routes>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover
          theme="dark"
          limit={3}
          toastClassName="toast-minimal"
        />
      </div>
    </Router>
  );
}

export default App;
