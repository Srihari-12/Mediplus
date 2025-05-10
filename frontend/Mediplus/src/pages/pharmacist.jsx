// PharmacistPortal.jsx — Enhanced UI with filters, queue, status actions
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Chip, Fade, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';

const PharmacistPortal = () => {
  const [queue, setQueue] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [otpDialog, setOtpDialog] = useState({ open: false, id: null });
  const [otp, setOtp] = useState('');
  const token = localStorage.getItem('token');

  const fetchQueue = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/queue', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setQueue(data);
      if (statusFilter === 'all') setFiltered(data);
      else setFiltered(data.filter(q => q.status === statusFilter));
    } catch (err) {
      console.error('Queue Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, [token]);

  const handleFilterChange = (_, newStatus) => {
    setStatusFilter(newStatus);
    if (newStatus === 'all') setFiltered(queue);
    else setFiltered(queue.filter(q => q.status === newStatus));
  };

  const handleMarkPreparing = async (prescriptionId) => {
    try {
      const res = await fetch(`http://localhost:8000/pharmacy/mark-preparing/${prescriptionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchQueue();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await fetch(`http://localhost:8000/pharmacy/confirm-pickup/${otpDialog.id}?otp_code=${otp.trim()}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('✅ OTP Verified. Status updated to Picked Up.');
        fetchQueue();
      } else {
        const data = await res.json();
        alert(`❌ ${data.detail || 'Invalid OTP.'}`);
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
    } finally {
      setOtpDialog({ open: false, id: null });
      setOtp('');
    }
  };

  const openPDF = (id) => {
    const url = `http://localhost:8000/prescriptions/view/${id}?token=${token}`;
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', p: 4, fontFamily: 'Poppins' }}>
      <Typography variant="h4" align="center" mb={4} sx={{ color: '#121a00', fontWeight: 600 }}>
        👩‍⚕️ Pharmacist Queue
      </Typography>

      <ToggleButtonGroup
        color="primary"
        value={statusFilter}
        exclusive
        onChange={handleFilterChange}
        sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="pending">Pending</ToggleButton>
        <ToggleButton value="preparing">Preparing</ToggleButton>
        <ToggleButton value="picked_up">Picked Up</ToggleButton>
      </ToggleButtonGroup>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography align="center">No prescriptions in this category.</Typography>
      ) : (
        filtered.map((item, index) => (
          <Fade in={true} timeout={500} key={item.queue_id}>
            <Paper elevation={4} sx={{ mb: 3, p: 3, borderRadius: 3 }}>
              <Typography variant="body1">
                <strong>#{index + 1}</strong> - RxID: {item.prescription_id.slice(0, 8)}...
              </Typography>
              <Typography variant="body2">⏱ ETA: {item.est_time}s</Typography>
              <Box mt={1}>
                {item.medicines.map((med, i) => (
                  <Chip key={i} label={`${med.name} (${med.type})`} sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
              <Box display="flex" gap={2} mt={2} flexWrap="wrap">
                <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => openPDF(item.prescription_id)}>
                  View PDF
                </Button>
                <Button variant="contained" sx={{ backgroundColor: '#678300' }} startIcon={<LocalShippingIcon />} onClick={() => handleMarkPreparing(item.prescription_id)}>
                  Mark as Preparing
                </Button>
                <Button variant="contained" sx={{ backgroundColor: '#121a00' }} startIcon={<LockIcon />} onClick={() => setOtpDialog({ open: true, id: item.prescription_id })}>
                  Verify OTP
                </Button>
              </Box>
            </Paper>
          </Fade>
        ))
      )}

      <Dialog open={otpDialog.open} onClose={() => setOtpDialog({ open: false, id: null })}>
        <DialogTitle>Enter OTP</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="OTP"
            variant="outlined"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialog({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleVerifyOtp} variant="contained" color="primary">Verify</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PharmacistPortal;
