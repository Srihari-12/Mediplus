import React, { useEffect, useState } from 'react';
import NotFoundImage from '../assets/not_found.svg';
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
} from '@mui/material';

const PatientPortal = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpModal, setOtpModal] = useState({ open: false, otp: '' });
  const [paymentModal, setPaymentModal] = useState({ open: false, prescriptionId: null });

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await fetch('http://localhost:8000/prescriptions', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setPrescriptions(data);
        } else {
          setPrescriptions([]);
        }
      } catch (err) {
        console.error('Error:', err);
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [token]);

  const handleBuy = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/pharmacy/send/${id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setOtpModal({ open: true, otp: data.otp_code });
      } else {
        alert(data.detail || 'Failed to send prescription');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong');
    }
  };

  const previewPDF = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/prescriptions/view/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch PDF');

      const blob = await response.blob();
      const pdfURL = URL.createObjectURL(blob);
      window.open(pdfURL, '_blank');
    } catch (err) {
      console.error('Preview error:', err);
      alert('Failed to preview the prescription.');
    }
  };

  const handleCloseModal = () => {
    setOtpModal({ open: false, otp: '' });
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
        fontFamily: 'Poppins',
        p: 4,
      }}
    >
      <Typography variant="h4" align="center" mb={4} sx={{ color: '#121a00', fontWeight: 600 }}>
        Your Prescriptions
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {prescriptions.length === 0 ? (
          <Box textAlign="center" mt={4}>
            <img src={NotFoundImage} alt="No prescriptions found" style={{ maxWidth: '300px' }} />
            <Typography variant="body1" sx={{ color: '#678300', mt: 2 }}>
              No prescriptions found. Please ask your doctor to upload one.
            </Typography>
          </Box>
        ) : (
          prescriptions
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((prescription) => (
              <Grid item xs={12} sm={6} md={4} key={prescription.id}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ color: '#495d00' }}>
                    Prescription
                  </Typography>
                  <Typography variant="body2"><strong>Doctor:</strong> {prescription.doctor_name || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Patient:</strong> {prescription.patient_name}</Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {new Date(prescription.created_at).toLocaleString()}
                  </Typography>

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2, borderColor: '#678300', color: '#678300' }}
                    onClick={() => previewPDF(prescription.id)}
                  >
                    View PDF
                  </Button>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 1.5, backgroundColor: '#121a00' }}
                    onClick={() => setPaymentModal({ open: true, prescriptionId: prescription.id })}
                  >
                    Buy
                  </Button>
                </Paper>
              </Grid>
            ))
        )}
      </Grid>

      {/* Payment Modal */}
      <Dialog open={paymentModal.open} onClose={() => setPaymentModal({ open: false, prescriptionId: null })}>
        <DialogTitle>Payment Gateway</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Enter payment details to continue:</Typography>
          <Box component="form" display="flex" flexDirection="column" gap={2} mt={2}>
            <input type="text" placeholder="Cardholder Name" />
            <input type="text" placeholder="Card Number" maxLength="16" />
            <Box display="flex" gap={2}>
              <input type="text" placeholder="MM/YY" maxLength="5" />
              <input type="text" placeholder="CVV" maxLength="3" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={async () => {
              setPaymentModal({ open: false, prescriptionId: null });
              await handleBuy(paymentModal.prescriptionId);
            }}
          >
            Pay ₹199
          </Button>
          <Button onClick={() => setPaymentModal({ open: false, prescriptionId: null })}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* OTP Modal */}
      <Dialog open={otpModal.open} onClose={handleCloseModal}>
        <DialogTitle>Prescription Sent</DialogTitle>
        <DialogContent>
          <Typography>
            ✅ Prescription sent to pharmacy.
            <br />
            📩 OTP: <strong>{otpModal.otp}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientPortal;
