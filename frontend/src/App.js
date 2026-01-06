import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import VehicleDetailsPage from './pages/VehicleDetailsPage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ProfilePage from './pages/ProfilePage';
import PaymentPage from './pages/PaymentPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import AddVehiclePage from './pages/AddVehiclePage';
import MyVehiclesPage from './pages/MyVehiclesPage';
import EditVehiclePage from './pages/EditVehiclePage';
import DriverRegisterPage from './pages/DriverRegisterPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminVehiclesPage from './pages/AdminVehiclesPage';
import AdminBookingsPage from './pages/AdminBookingsPage';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin()) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/vehicle/:id" element={<VehicleDetailsPage />} />
          <Route
            path="/booking/:vehicleId"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/:bookingId"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/:bookingId/callback"
            element={
              <ProtectedRoute>
                <PaymentCallbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-vehicle"
            element={
              <ProtectedRoute>
                <AddVehiclePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-vehicles"
            element={
              <ProtectedRoute>
                <MyVehiclesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-vehicle/:id"
            element={
              <ProtectedRoute>
                <EditVehiclePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver-register"
            element={
              <ProtectedRoute>
                <DriverRegisterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver-dashboard"
            element={
              <ProtectedRoute>
                <DriverDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/vehicles"
            element={
              <AdminRoute>
                <AdminVehiclesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <AdminRoute>
                <AdminBookingsPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;






