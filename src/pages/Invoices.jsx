import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
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
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Grid,
  Button,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintInvoice from '../components/PrintInvoice';

function Invoices() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedPrintInvoice, setSelectedPrintInvoice] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchInvoices();
  }, [tabValue]);

  const fetchInvoices = async () => {
    try {
      let invoicesQuery;
      if (tabValue === 1) {
        // Only fetch printed invoices
        invoicesQuery = query(
          collection(db, 'invoices'),
          where('printed', '==', true),
          orderBy('date', 'desc')
        );
      } else {
        // Fetch all invoices
        invoicesQuery = query(
          collection(db, 'invoices'),
          orderBy('date', 'desc')
        );
      }
      
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = [];
      
      invoicesSnapshot.forEach((doc) => {
        const data = doc.data();
        invoicesData.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || new Date(data.date),
          printed: data.printed || false // Set default value for printed field
        });
      });
      
      setInvoices(invoicesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoice data');
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setDialogOpen(true);
  };

  const handlePrintPreview = (invoice) => {
    setSelectedPrintInvoice(invoice);
    setPrintDialogOpen(true);
  };

  const handleExportToExcel = () => {
    // Implementation for Excel export
    console.log('Export to Excel');
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
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography component="h1" variant="h4" color="primary">
            Invoices
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportToExcel}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="All Invoices" />
          <Tab label="Printed Invoices" />
        </Tabs>
      </Paper>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by customer name or invoice ID"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <TableContainer component={Paper}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>Invoice ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.id}</TableCell>
                <TableCell>
                  {invoice.date.toLocaleDateString()}
                </TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell align="right">
                  Rs. {invoice.total?.toFixed(2)}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={invoice.printed ? "Printed" : "Not Printed"}
                    color={invoice.printed ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleViewInvoice(invoice)}
                    color="primary"
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handlePrintPreview(invoice)}
                    color="secondary"
                    size="small"
                  >
                    <PrintIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Invoice Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Invoice Details - {selectedInvoice?.id}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Customer Information</Typography>
              <Typography>Name: {selectedInvoice.customerName}</Typography>
              <Typography>Date: {selectedInvoice.date.toLocaleDateString()}</Typography>
              
              <Typography variant="h6" sx={{ mt: 2 }}>Items</Typography>
              <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">Rs. {item.price?.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          Rs. {(item.quantity * item.price)?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>
                Total Amount: Rs. {selectedInvoice.total?.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Print Preview - Invoice {selectedPrintInvoice?.id}
        </DialogTitle>
        <DialogContent>
          {selectedPrintInvoice && (
            <PrintInvoice 
              invoice={selectedPrintInvoice} 
              onClose={() => setPrintDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default Invoices;
