import { useState, useEffect } from 'react';
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StockHistory from '../components/StockHistory';
import HistoryIcon from '@mui/icons-material/History';
import { serverTimestamp } from 'firebase/firestore';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ItemAnalytics from '../components/ItemAnalytics';

function Inventory() {
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState([]);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    price: '',
    minQuantity: ''
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const stocksQuery = query(collection(db, 'stocks'));
      const stocksSnapshot = await getDocs(stocksQuery);
      const stocksData = [];
      
      stocksSnapshot.forEach((doc) => {
        stocksData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setStocks(stocksData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setError('Failed to load inventory data');
      setLoading(false);
    }
  };

  const handleOpenDialog = (stock = null) => {
    if (stock) {
      setSelectedStock(stock);
      setFormData({
        name: stock.name || '',
        quantity: stock.quantity || '',
        price: stock.price || '',
        minQuantity: stock.minQuantity || ''
      });
    } else {
      setSelectedStock(null);
      setFormData({
        name: '',
        quantity: '',
        price: '',
        minQuantity: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStock(null);
    setFormData({
      name: '',
      quantity: '',
      price: '',
      minQuantity: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value)
    }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedStock) {
        // Update existing stock
        await updateDoc(doc(db, 'stocks', selectedStock.id), formData);
      } else {
        // Add new stock
        await addDoc(collection(db, 'stocks'), formData);
      }
      handleCloseDialog();
      fetchStocks();
    } catch (error) {
      console.error('Error saving stock:', error);
      setError('Failed to save stock data');
    }
  };

  const handleDelete = async (stockId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, 'stocks', stockId));
        fetchStocks();
      } catch (error) {
        console.error('Error deleting stock:', error);
        setError('Failed to delete stock');
      }
    }
  };

  const handleStockUpdate = async (itemId, previousQuantity, newQuantity, type = 'manual', notes = '') => {
    try {
      // Update the item stock
      await updateDoc(doc(db, 'stocks', itemId), {
        quantity: newQuantity
      });

      // Record the history
      await addDoc(collection(db, 'stock_history'), {
        itemId,
        timestamp: serverTimestamp(),
        type,
        previousQuantity,
        newQuantity,
        change: newQuantity - previousQuantity,
        updatedBy: auth.currentUser.email,
        notes
      });

      // Refresh the inventory data
      fetchStocks();
    } catch (error) {
      console.error('Error updating stock:', error);
      setError('Failed to update stock');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 1, sm: 2 }, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" component="h2" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
            Inventory Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ 
              whiteSpace: 'nowrap',
              minWidth: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Item
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <TableContainer component={Paper} sx={{ maxHeight: { xs: '60vh', sm: '70vh' } }}>
              <Table stickyHeader size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Min Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{stock.name}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{stock.quantity}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>LKR {stock.price?.toFixed(2)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{stock.minQuantity}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(stock)}
                            sx={{ p: { xs: 0.5, sm: 1 } }}
                          >
                            <EditIcon fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(stock.id)}
                            sx={{ p: { xs: 0.5, sm: 1 } }}
                          >
                            <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setSelectedItem(stock);
                              setHistoryOpen(true);
                            }}
                            title="View History"
                          >
                            <HistoryIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setSelectedItem(stock);
                              setAnalyticsOpen(true);
                            }}
                            title="View Analytics"
                          >
                            <AnalyticsIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
        <DialogTitle>
          {selectedStock ? 'Edit Stock' : 'Add New Stock'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="name"
              label="Item Name"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
            />
            <TextField
              name="quantity"
              label="Quantity"
              type="number"
              fullWidth
              value={formData.quantity}
              onChange={handleInputChange}
            />
            <TextField
              name="price"
              label="Price"
              type="number"
              fullWidth
              value={formData.price}
              onChange={handleInputChange}
            />
            <TextField
              name="minQuantity"
              label="Minimum Quantity"
              type="number"
              fullWidth
              value={formData.minQuantity}
              onChange={handleInputChange}
              helperText="Alert will show when stock is below this quantity"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedStock ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <StockHistory
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setSelectedItem(null);
        }}
        itemId={selectedItem?.id}
        itemName={selectedItem?.name}
      />

      <ItemAnalytics
        open={analyticsOpen}
        onClose={() => {
          setAnalyticsOpen(false);
          setSelectedItem(null);
        }}
        itemId={selectedItem?.id}
        itemName={selectedItem?.name}
      />
    </Container>
  );
}

export default Inventory;
