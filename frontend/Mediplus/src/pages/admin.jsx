import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import { Delete, Edit, CloudUpload, Search, BarChart } from '@mui/icons-material';

const AdminPortal = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csvFile, setCsvFile] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, medicine: null });
  const [updatedQty, setUpdatedQty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [analytics, setAnalytics] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const token = localStorage.getItem('token');

  const fetchInventory = async () => {
    try {
      const res = await fetch('http://localhost:8000/admin/inventory/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
        setFilteredInventory(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('http://localhost:8000/analytics/inventory', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
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

  const uniqueCategories = ['All', ...new Set(inventory.map((item) => item.unit))];

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/admin/inventory/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleUploadCsv = async () => {
    if (!csvFile) return;
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await fetch('http://localhost:8000/admin/inventory/upload-csv', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f7f8f9',
        backgroundImage: `radial-gradient(#ccff00 0.8px, transparent 0.8px)`,
        backgroundSize: '20px 20px',
        fontFamily: 'Poppins',
        p: 4,
      }}
    >
      <Typography variant="h4" align="center" mb={4} sx={{ color: '#121a00', fontWeight: 600 }}>
        Medicine Inventory
      </Typography>

      <Box display="flex" justifyContent="center" gap={2} mb={3}>
        <Button variant="outlined" startIcon={<BarChart />} onClick={() => {
          fetchAnalytics();
          setShowAnalytics((prev) => !prev);
        }}>
          {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
        </Button>
      </Box>

      {showAnalytics && (
        <Paper sx={{ mb: 4, p: 3, borderRadius: 3 }} elevation={2}>
          <Typography variant="h6" mb={2} sx={{ fontWeight: 500 }}>
            Inventory Analytics
          </Typography>
          <Grid container spacing={2}>
            {analytics.map((item, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: '#fff9e6' }}>
                  <Typography variant="subtitle1" sx={{ color: '#678300' }}>
                    {item.medicine_name}
                  </Typography>
                  <Typography variant="body2">
                    Sold: {item.quantity_sold} {item.unit}
                  </Typography>
                  <Typography variant="body2">
                    Remaining: {item.quantity_remaining} {item.unit}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Paper
        elevation={2}
        sx={{ mb: 4, p: 3, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 2 }}
      >
        <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUpload />}
            sx={{ color: '#121a00', borderColor: '#121a00' }}
          >
            Select CSV
            <input type="file" hidden accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#121a00', '&:hover': { backgroundColor: '#2c3a00' } }}
            onClick={handleUploadCsv}
            disabled={!csvFile}
          >
            Upload CSV
          </Button>
        </Box>

        <TextField
          placeholder="Search medicine..."
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          fullWidth
          label="Filter by Unit"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {uniqueCategories.map((unit) => (
            <MenuItem key={unit} value={unit}>
              {unit}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      <Grid container spacing={3} justifyContent="center">
        {filteredInventory.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Paper elevation={4} sx={{ p: 3, borderRadius: 4, backgroundColor: '#ffffff' }}>
              <Typography variant="h6" sx={{ color: '#495d00', mb: 1 }}>
                {item.medicine_name}
              </Typography>
              <Typography>
                <strong>Quantity:</strong> {item.quantity} {item.unit}
              </Typography>
              <Stack direction="row" spacing={1} mt={2}>
                <IconButton
                  sx={{ color: '#678300' }}
                  onClick={() => setEditDialog({ open: true, medicine: item })}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  sx={{ color: 'red' }}
                  onClick={() => handleDelete(item.id)}
                >
                  <Delete />
                </IconButton>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Update Quantity Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, medicine: null })}>
        <DialogTitle>Update Quantity</DialogTitle>
        <DialogContent>
          <TextField
            type="number"
            label="Quantity"
            fullWidth
            value={updatedQty}
            onChange={(e) => setUpdatedQty(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, medicine: null })}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPortal;