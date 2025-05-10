import React, { useEffect, useState } from 'react';
import NotFoundImage from '../assets/not_found.svg';
import {
  Box, Typography, Paper, Button, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, Fab
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';

const PatientPortal = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [otpModal, setOtpModal] = useState({ open: false, otp: '' });
  const [paymentModal, setPaymentModal] = useState({ open: false, prescriptionId: null });
  const [timers, setTimers] = useState({});
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await fetch('http://localhost:8000/prescriptions', {
          method: 'GET', headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPrescriptions(res.ok ? data : []);
      } catch {
        setPrescriptions([]);
      }
    };
    fetchPrescriptions();
  }, [token]);

  const handleBuy = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/pharmacy/send/${id}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOtpModal({ open: true, otp: data.otp_code });
        if (data.estimated_wait_time_seconds)
          setTimers((prev) => ({ ...prev, [id]: parseInt(data.estimated_wait_time_seconds) }));
      } else alert(data.detail?.message || 'Failed to send prescription');
    } catch {
      alert('Something went wrong');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = {};
        for (const key in prev) updated[key] = Math.max(prev[key] - 1, 0);
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const previewPDF = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/prescriptions/view/${id}`, {
        method: 'GET', headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      alert('Failed to preview the prescription.');
    }
  };

  const handleCloseModal = () => setOtpModal({ open: false, otp: '' });
  const formatTimer = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7f8f9', fontFamily: 'Poppins', p: 4, pb: 10 }}>
      <Typography variant="h4" align="center" mb={4} sx={{ color: '#121a00', fontWeight: 600 }}>
        Your Prescriptions
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {prescriptions.length === 0 ? (
          <Box textAlign="center" mt={4}>
            <img src={NotFoundImage} alt="No prescriptions found" style={{ maxWidth: 300 }} />
            <Typography variant="body1" sx={{ color: '#678300', mt: 2 }}>
              No prescriptions found. Please ask your doctor to upload one.
            </Typography>
          </Box>
        ) : (
          prescriptions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ color: '#495d00' }}>Prescription</Typography>
                <Typography variant="body2"><strong>Doctor:</strong> {p.doctor_name || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Patient:</strong> {p.patient_name}</Typography>
                <Typography variant="body2"><strong>Note:</strong> {p.remarks || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Date:</strong> {new Date(p.created_at).toLocaleString()}</Typography>
                {timers[p.id] !== undefined && (
                  <Typography variant="body2" sx={{ color: '#ff5722', mt: 1 }}>
                    ⏳ Estimated Wait Time: {formatTimer(timers[p.id])}
                  </Typography>
                )}
                <Button variant="outlined" fullWidth sx={{ mt: 2, borderColor: '#678300', color: '#678300' }}
                  onClick={() => previewPDF(p.id)}>View PDF</Button>
                <Button variant="contained" fullWidth sx={{ mt: 1.5, backgroundColor: '#121a00' }}
                  onClick={() => setPaymentModal({ open: true, prescriptionId: p.id })}>Buy</Button>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      <Fab color="primary" onClick={() => navigate('/chatbot')} sx={{
        position: 'fixed', bottom: 30, right: 30,
        backgroundColor: '#678300', '&:hover': { backgroundColor: '#495d00' }
      }}>
        <ChatIcon />
      </Fab>

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
          <Button variant="contained" onClick={async () => {
            setPaymentModal({ open: false, prescriptionId: null });
            await handleBuy(paymentModal.prescriptionId);
          }}>Pay ₹199</Button>
          <Button onClick={() => setPaymentModal({ open: false, prescriptionId: null })}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={otpModal.open} onClose={handleCloseModal}>
        <DialogTitle>Prescription Sent</DialogTitle>
        <DialogContent>
          <Typography>✅ Prescription sent to pharmacy.<br />📩 OTP: <strong>{otpModal.otp}</strong></Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientPortal;
