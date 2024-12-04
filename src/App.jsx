import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import { auth } from './firebase';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              user ? (
                <Layout>
                  <Dashboard />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/inventory"
            element={
              user ? (
                <Layout>
                  <Inventory />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/invoices"
            element={
              user ? (
                <Layout>
                  <Invoices />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/expenses"
            element={
              user ? (
                <Layout>
                  <Expenses />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          {/* Catch-all route */}
          <Route
            path="*"
            element={
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                gap: '20px'
              }}>
                <h1>Page Not Found</h1>
                <Link to="/login" style={{ 
                  color: '#1976d2',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  border: '1px solid #1976d2',
                  borderRadius: '4px',
                  transition: 'all 0.3s'
                }}>
                  Go to Login
                </Link>
              </div>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
