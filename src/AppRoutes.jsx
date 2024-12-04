import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import Layout from './components/Layout';
import { CircularProgress, Box } from '@mui/material';

function PrivateRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="/inventory" element={
        <PrivateRoute>
          <Inventory />
        </PrivateRoute>
      } />
      
      <Route path="/invoices" element={
        <PrivateRoute>
          <Invoices />
        </PrivateRoute>
      } />
      
      <Route path="/expenses" element={
        <PrivateRoute>
          <Expenses />
        </PrivateRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
} 