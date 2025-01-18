import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import ApiTest from './components/ApiTest';
import PrivateRoute from './components/PrivateRoute';
import './styles/App.css';
import './styles/globals.scss'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/carbon/Dashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/carbon/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
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
