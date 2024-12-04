import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [stockValue, setStockValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch invoices
        const invoicesQuery = query(collection(db, 'invoices'));
        const invoicesSnapshot = await getDocs(invoicesQuery);
        let totalRev = 0;
        const dailyRevenue = {};
        
        invoicesSnapshot.forEach((doc) => {
          const invoice = doc.data();
          totalRev += invoice.total || 0;
          
          // Group by date for chart
          const date = new Date(invoice.date).toLocaleDateString();
          dailyRevenue[date] = (dailyRevenue[date] || 0) + (invoice.total || 0);
        });
        
        setTotalRevenue(totalRev);
        setRevenueData(Object.entries(dailyRevenue).map(([date, amount]) => ({
          date,
          amount,
        })));

        // Fetch expenses
        const expensesQuery = query(collection(db, 'expenses'));
        const expensesSnapshot = await getDocs(expensesQuery);
        let totalExp = 0;
        
        expensesSnapshot.forEach((doc) => {
          const expense = doc.data();
          totalExp += expense.amount || 0;
        });
        
        setTotalExpenses(totalExp);

        // Fetch stock value
        const stocksQuery = query(collection(db, 'stocks'));
        const stocksSnapshot = await getDocs(stocksQuery);
        let totalStock = 0;
        
        stocksSnapshot.forEach((doc) => {
          const stock = doc.data();
          totalStock += (stock.quantity || 0) * (stock.price || 0);
        });
        
        setStockValue(totalStock);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Revenue
            </Typography>
            <Typography component="p" variant="h4">
              Rs. {totalRevenue.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Expenses
            </Typography>
            <Typography component="p" variant="h4">
              Rs. {totalExpenses.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Stock Value
            </Typography>
            <Typography component="p" variant="h4">
              Rs. {stockValue.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        {/* Revenue Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Revenue Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
