import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useState, useEffect } from 'react';

export default function EditStockDialog({ open, onClose, item, onUpdate }) {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setQuantity(item?.quantity?.toString() || '');
      setNotes('');
    }
  }, [open, item]);

  const handleSubmit = () => {
    const newQuantity = Number(quantity);
    if (!isNaN(newQuantity)) {
      onUpdate(item.id, item.quantity, newQuantity, 'manual', notes);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Stock - {item?.name}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="New Quantity"
          type="number"
          fullWidth
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Notes"
          fullWidth
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Update</Button>
      </DialogActions>
    </Dialog>
  );
} 