import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Typography,
  IconButton,
  Box,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, addDays } from 'date-fns';

export default function ItemAnalytics({ open, onClose, itemId, itemName }) {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [analytics, setAnalytics] = useState({
    totalSold: 0,
    totalFree: 0,
    revenue: 0,
    dailyData: []
  });

  // Generate last 12 months for dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: date,
      label: format(date, 'MMMM yyyy')
    };
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!itemId) return;
      
      setLoading(true);
      try {
        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);

        // Query invoices for the selected month
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('timestamp', '>=', Timestamp.fromDate(start)),
          where('timestamp', '<=', Timestamp.fromDate(end))
        );

        const invoicesSnapshot = await getDocs(invoicesQuery);
        
        let totalSold = 0;
        let totalFree = 0;
        let revenue = 0;
        const dailyStats = {};

        // Process each invoice
        invoicesSnapshot.forEach(doc => {
          const invoice = doc.data();
          if (!invoice.timestamp) return;

          const date = invoice.timestamp.toDate();
          const dayKey = format(date, 'dd/MM/yyyy');

          // Initialize daily stats if not exists
          if (!dailyStats[dayKey]) {
            dailyStats[dayKey] = { sold: 0, free: 0, revenue: 0 };
          }

          // Find all items in this invoice that match our itemId
          invoice.items?.forEach(item => {
            if (item.id === itemId) {
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;

              if (item.isFree) {
                totalFree += quantity;
                dailyStats[dayKey].free += quantity;
              } else {
                totalSold += quantity;
                const itemRevenue = price * quantity;
                revenue += itemRevenue;
                dailyStats[dayKey].sold += quantity;
                dailyStats[dayKey].revenue += itemRevenue;
              }
            }
          });
        });

        // Ensure we have entries for all days in the month
        let currentDate = start;
        while (currentDate <= end) {
          const dayKey = format(currentDate, 'dd/MM/yyyy');
          if (!dailyStats[dayKey]) {
            dailyStats[dayKey] = { sold: 0, free: 0, revenue: 0 };
          }
          currentDate = addDays(currentDate, 1);
        }

        // Convert daily stats to chart data
        const dailyData = Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          sold: stats.sold,
          free: stats.free,
          revenue: stats.revenue
        }));

        setAnalytics({
          totalSold,
          totalFree,
          revenue,
          dailyData: dailyData.sort((a, b) => new Date(a.date) - new Date(b.date))
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchAnalytics();
    }
  }, [itemId, selectedMonth, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Item Analytics - {itemName}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Month</InputLabel>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              label="Select Month"
            >
              {monthOptions.map((option) => (
                <MenuItem key={option.label} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">Total Sold</Typography>
                  <Typography variant="h4">{analytics.totalSold}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="error">Free Items</Typography>
                  <Typography variant="h4">{analytics.totalFree}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">Revenue</Typography>
                  <Typography variant="h4">LKR {analytics.revenue.toFixed(2)}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === "revenue" ? `LKR ${value.toFixed(2)}` : value,
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="sold" name="Sold Items" fill="#2196f3" />
                  <Bar dataKey="free" name="Free Items" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 