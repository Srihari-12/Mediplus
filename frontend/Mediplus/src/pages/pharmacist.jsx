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
} from '@mui/material';

const PharmacistPortal = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpDialog, setOtpDialog] = useState({ open: false, id: null });
  const [otp, setOtp] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPendingPrescriptions = async () => {
      try {
        const res = await fetch('http://localhost:8000/pharmacy/pending', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPrescriptions(data);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPrescriptions();
  }, [token]);

  const handleVerifyOtp = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/pharmacy/confirm-pickup/${otpDialog.id}?otp=${otp}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        alert('✅ OTP Verified. Status Updated.');
        setPrescriptions((prev) => prev.filter((p) => p.id !== otpDialog.id));
      } else {
        alert('❌ Invalid OTP.');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
    } finally {
      setOtpDialog({ open: false, id: null });
      setOtp('');
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
        Prescriptions To Fulfill
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {prescriptions.length === 0 ? (
          <Typography>No pending prescriptions.</Typography>
        ) : (
          prescriptions.map((prescription) => (
            <Grid item xs={12} sm={6} md={4} key={prescription.id}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Patient:</strong> {prescription.patient_name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Doctor:</strong> {prescription.doctor_name || 'N/A'}
                </Typography>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 1, color: '#678300', borderColor: '#678300' }}
                  onClick={() =>
                    window.open(
                      `http://localhost:8000/prescriptions/view/${prescription.id}`,
                      '_blank'
                    )
                  }
                >
                  View Prescription
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 1.5, backgroundColor: '#121a00', '&:hover': { backgroundColor: '#2c3a00' } }}
                  onClick={() => setOtpDialog({ open: true, id: prescription.id })}
                >
                  Verify OTP (Pickup)
                </Button>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      {/* OTP Modal */}
      <Dialog open={otpDialog.open} onClose={() => setOtpDialog({ open: false, id: null })}>
        <DialogTitle>Enter OTP</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="OTP"
            fullWidth
            variant="outlined"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialog({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleVerifyOtp} variant="contained" color="primary">
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PharmacistPortal;
