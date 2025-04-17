import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Chip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VisibilityIcon from '@mui/icons-material/Visibility';

const PharmacistPortal = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [otpDialog, setOtpDialog] = useState({ open: false, id: null });
  const [otp, setOtp] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await fetch('http://localhost:8000/pharmacy/list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPrescriptions(data);
          setFiltered(data);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [token]);

  const handleFilterChange = (_, newStatus) => {
    setStatusFilter(newStatus);
    if (newStatus === 'all') {
      setFiltered(prescriptions);
    } else {
      setFiltered(prescriptions.filter(p => p.status === newStatus));
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/pharmacy/confirm-pickup/${otpDialog.id}?otp_code=${otp.trim()}`, // 🔧 Trimmed here!
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        alert('✅ OTP Verified. Status updated to Picked Up.');
        setPrescriptions(prev =>
          prev.map(p => p.prescription_id === otpDialog.id ? { ...p, status: 'picked_up' } : p)
        );
        setFiltered(prev =>
          prev.map(p => p.prescription_id === otpDialog.id ? { ...p, status: 'picked_up' } : p)
        );
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

  const handleMarkPreparing = async (prescriptionId) => {
    try {
      const res = await fetch(`http://localhost:8000/pharmacy/mark-preparing/${prescriptionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPrescriptions(prev =>
          prev.map(p => p.prescription_id === prescriptionId ? { ...p, status: 'preparing' } : p)
        );
        setFiltered(prev =>
          prev.map(p => p.prescription_id === prescriptionId ? { ...p, status: 'preparing' } : p)
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const openPDF = (id) => {
    const pdfURL = `http://localhost:8000/prescriptions/view/${id}?token=${token}`;
    window.open(pdfURL, '_blank');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7f8f9', p: 4, fontFamily: 'Poppins' }}>
      <Typography variant="h4" align="center" mb={4} sx={{ color: '#121a00', fontWeight: 600 }}>
        Pharmacist Portal
      </Typography>

      <ToggleButtonGroup
        color="primary"
        value={statusFilter}
        exclusive
        onChange={handleFilterChange}
        sx={{ mb: 4, justifyContent: 'center', width: '100%' }}
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
      ) : (
        <Grid container spacing={3}>
          {filtered.length === 0 ? (
            <Typography textAlign="center" width="100%">No prescriptions found.</Typography>
          ) : (
            filtered.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={600}>Patient: {p.patient_name}</Typography>
                  <Typography variant="body2">Doctor: {p.doctor_name}</Typography>
                  <Typography variant="body2">Date: {p.created_at}</Typography>
                  <Chip
                    label={p.status.replace('_', ' ').toUpperCase()}
                    color={
                      p.status === 'picked_up' ? 'success' :
                      p.status === 'preparing' ? 'info' : 'warning'
                    }
                    sx={{ mt: 1 }}
                  />

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      mt: 2,
                      borderColor: '#678300',
                      color: '#678300',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#ccff00',
                        borderColor: '#678300'
                      },
                    }}
                    onClick={() => openPDF(p.prescription_id)}
                    startIcon={<VisibilityIcon />}
                  >
                    View PDF
                  </Button>

                  {p.status === 'pending' && (
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 1.5, backgroundColor: '#2c3a00' }}
                      startIcon={<LocalShippingIcon />}
                      onClick={() => handleMarkPreparing(p.prescription_id)}
                    >
                      Mark as Preparing
                    </Button>
                  )}

                  {p.status === 'preparing' && (
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 1.5, backgroundColor: '#121a00' }}
                      startIcon={<LockIcon />}
                      onClick={() => setOtpDialog({ open: true, id: p.prescription_id })}
                    >
                      Verify OTP (Pickup)
                    </Button>
                  )}
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* OTP Modal */}
      <Dialog open={otpDialog.open} onClose={() => setOtpDialog({ open: false, id: null })}>
        <DialogTitle sx={{ fontFamily: 'Poppins' }}>Enter OTP</DialogTitle>
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
