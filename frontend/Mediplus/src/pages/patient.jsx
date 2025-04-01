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
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log('Fetched prescriptions:', data);
          setPrescriptions(data);
        } else {
          const errData = await res.json();
          console.error('Fetch error:', errData);
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

  const handleDownload = async (id, fileName = 'prescription.pdf') => {
    try {
      const response = await fetch(`http://localhost:8000/prescriptions/view/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to download');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download the prescription.');
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
            <img
              src={NotFoundImage}
              alt="No prescriptions found"
              style={{ maxWidth: '300px', marginBottom: '16px' }}
            />
            <Typography variant="body1" sx={{ fontFamily: 'Poppins', color: '#678300' }}>
              No prescriptions found. Please ask your doctor to create a prescription and upload for you.
            </Typography>
          </Box>
        ) : (
          [...prescriptions]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((prescription) => (
              <Grid item xs={12} sm={6} md={4} key={prescription.id}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ color: '#495d00' }}>
                    Prescription
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Doctor:</strong> {prescription.doctor_name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Patient:</strong> {prescription.patient_name}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Date:</strong>{' '}
                    {prescription.created_at
                      ? new Date(prescription.created_at).toLocaleString()
                      : 'N/A'}
                  </Typography>

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      mt: 2,
                      borderColor: '#678300',
                      color: '#678300',
                      fontFamily: 'Poppins',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#ccff00',
                        borderColor: '#678300',
                      },
                    }}
                    onClick={() => handleDownload(prescription.id, `prescription_${prescription.id}.pdf`)}
                  >
                    View / Download PDF
                  </Button>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      mt: 1.5,
                      backgroundColor: '#121a00',
                      fontFamily: 'Poppins',
                      '&:hover': {
                        backgroundColor: '#2c3a00',
                      },
                    }}
                    onClick={() => setPaymentModal({ open: true, prescriptionId: prescription.id })}
                  >
                    Buy
                  </Button>
                </Paper>
              </Grid>
            ))
        )}
      </Grid>

 
      <Dialog open={paymentModal.open} onClose={() => setPaymentModal({ open: false, prescriptionId: null })}>
  <DialogTitle sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>Payment Gateway</DialogTitle>
  <DialogContent sx={{ fontFamily: 'Poppins' }}>
    <Typography gutterBottom>
      Enter your payment details below to complete your transaction securely.
    </Typography>

    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <input
        type="text"
        placeholder="Cardholder Name"
        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
      />
      <input
        type="text"
        placeholder="Card Number"
        maxLength="16"
        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <input
          type="text"
          placeholder="MM/YY"
          maxLength="5"
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder="CVV"
          maxLength="3"
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
      </Box>
    </Box>
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button
      variant="contained"
      sx={{ backgroundColor: '#121a00', fontFamily: 'Poppins' }}
      onClick={async () => {
        setPaymentModal({ open: false, prescriptionId: null });
        await handleBuy(paymentModal.prescriptionId);
      }}
    >
      Pay ₹199
    </Button>
    <Button
      onClick={() => setPaymentModal({ open: false, prescriptionId: null })}
      sx={{ fontFamily: 'Poppins', color: '#121a00', borderColor: '#121a00', '&:hover': { backgroundColor: '#f0f0f0' } }}
    >
      Cancel

    </Button>
  </DialogActions>
</Dialog>


      {/* ✅ OTP Modal */}
      <Dialog open={otpModal.open} onClose={handleCloseModal}>
        <DialogTitle>Prescription Sent</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Poppins' }}>
            ✅ Your prescription has been sent to the pharmacy.
            <br />
            📩 OTP Code: <strong>{otpModal.otp}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientPortal;
