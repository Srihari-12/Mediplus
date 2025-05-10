import React, { useState, useEffect } from 'react';
import {
  Paper, Button, TextField, InputAdornment, MenuItem, Grid, Typography, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Stack
} from '@mui/material';
import { CloudUpload, Search, Edit, Delete } from '@mui/icons-material';

const InventoryUpload = ({ token }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editDialog, setEditDialog] = useState({ open: false, medicine: null });
  const [updatedQty, setUpdatedQty] = useState('');

  const fetchInventory = async () => {
    try {
      const res = await fetch('http://localhost:8000/admin/inventory/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
        setFilteredInventory(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

  useEffect(() => {
    let filtered = inventory;
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item) => item.unit === selectedCategory);
    }
    setFilteredInventory(filtered);
  }, [searchTerm, selectedCategory, inventory]);

  const handleUploadCsv = async () => {
    if (!csvFile) return;
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await fetch('http://localhost:8000/admin/inventory/upload-csv', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        fetchInventory();
        setCsvFile(null);
      }
    } catch (err) {
      console.error('CSV Upload Failed', err);
    }
  };

  const handleUpdate = async () => {
    try {
      await fetch(`http://localhost:8000/admin/inventory/update/${editDialog.medicine.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: parseInt(updatedQty) }),
      });
      setEditDialog({ open: false, medicine: null });
      setUpdatedQty('');
      fetchInventory();
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/admin/inventory/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInventory();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const uniqueCategories = ['All', ...new Set(inventory.map((item) => item.unit))];

  return (
    <Paper elevation={2} sx={{ mb: 4, p: 3, borderRadius: 2 }}>
      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" mb={2}>
        <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
          Select CSV
          <input type="file" hidden accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
        </Button>
        <Button variant="contained" onClick={handleUploadCsv} disabled={!csvFile}>Upload CSV</Button>
      </Stack>

      <TextField placeholder="Search medicine..." fullWidth value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>) }} sx={{ mb: 2 }} />

      <TextField select fullWidth label="Filter by Unit" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
        {uniqueCategories.map((unit) => (
          <MenuItem key={unit} value={unit}>{unit}</MenuItem>
        ))}
      </TextField>

      <Grid container spacing={3} justifyContent="center" mt={2}>
        {filteredInventory.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="h6">{item.medicine_name}</Typography>
              <Typography><strong>Qty:</strong> {item.quantity} {item.unit}</Typography>
              <Stack direction="row" spacing={1} mt={1}>
                <IconButton color="primary" onClick={() => setEditDialog({ open: true, medicine: item })}><Edit /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, medicine: null })}>
        <DialogTitle>Update Quantity</DialogTitle>
        <DialogContent>
          <TextField type="number" label="Quantity" fullWidth value={updatedQty} onChange={(e) => setUpdatedQty(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, medicine: null })}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default InventoryUpload;
