import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Grid,
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function Expenses() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');
  const [categoryData, setCategoryData] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const expensesQuery = query(
          collection(db, 'expenses'),
          orderBy('date', 'desc')
        );
        const expensesSnapshot = await getDocs(expensesQuery);
        const expensesData = [];
        const categoryTotals = {};
        
        expensesSnapshot.forEach((doc) => {
          const expense = {
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate?.() || new Date(doc.data().date)
          };
          expensesData.push(expense);
          
          // Calculate category totals
          const category = expense.category || 'Uncategorized';
          categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
        });
        
        // Transform category totals for pie chart
        const categoryChartData = Object.entries(categoryTotals).map(([name, value]) => ({
          name,
          value
        }));
        
        setExpenses(expensesData);
        setCategoryData(categoryChartData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        setError('Failed to load expense data');
        setLoading(false);
      }
    };

    fetchExpenses();
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
      <Typography component="h1" variant="h4" color="primary" gutterBottom>
        Expenses
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Expense Categories Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Expenses by Category
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `Rs. ${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Expenses Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date.toLocaleDateString()}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.category || 'Uncategorized'}</TableCell>
                    <TableCell align="right">
                      Rs. {expense.amount?.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Expenses;
