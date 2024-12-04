import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

export default function StockHistory({ open, onClose, itemId, itemName }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!itemId) return;
      
      try {
        let q = query(
          collection(db, 'stock_history'),
          where('itemId', '==', itemId),
          orderBy('timestamp', 'desc')
        );
        
        let querySnapshot = await getDocs(q);
        let historyData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));

        q = query(
          collection(db, 'invoices'),
          where('items', 'array-contains', { id: itemId })
        );
        
        querySnapshot = await getDocs(q);
        const invoiceHistory = querySnapshot.docs.flatMap(doc => {
          const invoice = doc.data();
          const items = invoice.items.filter(item => item.id === itemId);
          
          return items.map(item => ({
            id: `${doc.id}-${item.id}`,
            itemId: item.id,
            timestamp: invoice.timestamp?.toDate(),
            type: 'invoice',
            previousQuantity: null,
            newQuantity: null,
            change: -item.quantity,
            updatedBy: invoice.createdBy || 'System',
            notes: `Invoice #${doc.id}`,
            isFree: item.isFree || false
          }));
        });

        historyData = [...historyData, ...invoiceHistory].sort((a, b) => 
          b.timestamp - a.timestamp
        );
        
        setHistory(historyData);
      } catch (error) {
        console.error('Error fetching stock history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchHistory();
    }
  }, [itemId, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Stock History - {itemName}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Previous Quantity</TableCell>
                <TableCell align="right">Change</TableCell>
                <TableCell align="right">New Quantity</TableCell>
                <TableCell>Updated By</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {record.timestamp ? format(record.timestamp, 'dd/MM/yyyy HH:mm') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {record.type}
                    {record.isFree && (
                      <Typography component="span" color="error" sx={{ ml: 1 }}>
                        (Free)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{record.previousQuantity}</TableCell>
                  <TableCell align="right" sx={{
                    color: record.change > 0 ? 'success.main' : 'error.main'
                  }}>
                    {record.change > 0 ? `+${record.change}` : record.change}
                  </TableCell>
                  <TableCell align="right">{record.newQuantity}</TableCell>
                  <TableCell>{record.updatedBy}</TableCell>
                  <TableCell>{record.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
} 