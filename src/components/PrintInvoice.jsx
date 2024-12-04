import { Box, Typography, Grid, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PrintInvoice({ invoice, onClose }) {
  const handlePrint = async () => {
    const printContent = document.getElementById('printable-invoice');
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;

    // Mark invoice as printed in Firebase
    try {
      await updateDoc(doc(db, 'invoices', invoice.id), {
        printed: true
      });
      onClose();
      window.location.reload(); // Refresh to update the printed status
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Invoice
        </Button>
      </Box>

      <Box id="printable-invoice" sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          INVOICE
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <Typography variant="h6">Invoice Details</Typography>
            <Typography>Invoice #: {invoice.id}</Typography>
            <Typography>Date: {invoice.date.toLocaleDateString()}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h6">Customer Information</Typography>
            <Typography>Name: {invoice.customerName}</Typography>
            {invoice.customerPhone && (
              <Typography>Phone: {invoice.customerPhone}</Typography>
            )}
            {invoice.customerAddress && (
              <Typography>Address: {invoice.customerAddress}</Typography>
            )}
          </Grid>
        </Grid>

        <Paper elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">Rs. {item.price?.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    Rs. {(item.quantity * item.price)?.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                  Subtotal
                </TableCell>
                <TableCell align="right">
                  Rs. {invoice.total?.toFixed(2)}
                </TableCell>
              </TableRow>
              {invoice.discount > 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                    Discount
                  </TableCell>
                  <TableCell align="right">
                    Rs. {invoice.discount?.toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                  Total Amount
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Rs. {(invoice.total - (invoice.discount || 0)).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            Thank you for your business!
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
