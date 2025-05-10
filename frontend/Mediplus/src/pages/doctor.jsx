// DoctorPortal.jsx (Updated)
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const DoctorPortal = () => {
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lowStockWarning, setLowStockWarning] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [remarks, setRemarks] = useState('');

  const token = localStorage.getItem('token');

  const handleSearch = async () => {
    if (!patientName || !patientId) {
      alert('Please enter both patient name and ID');
      return;
    }

    setLoading(true);
    setPrescriptions([]);
    setSearched(true);

    try {
      const res = await fetch(
        `http://localhost:8000/prescriptions?name=${patientName}&user_id=${patientId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data);
      } else {
        setPrescriptions([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !patientName || !patientId) {
      alert('Please select a PDF file and fill in patient details.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_name', patientName);
    formData.append('patient_user_id', patientId);
    formData.append('remarks', remarks);

    try {
      const res = await fetch('http://localhost:8000/prescriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ Prescription uploaded successfully!');
        setPrescriptions((prev) => [data, ...prev]);
        setFile(null);
        setRemarks('');
        setLowStockWarning(null);
      } else if (res.status === 422 && data.detail?.low_stock) {
        setLowStockWarning(data.detail.low_stock);
        setShowDialog(true);
      } else {
        alert(data.detail?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('❌ Something went wrong.');
    }
  };

  const handleUploadOverride = async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_name', patientName);
    formData.append('patient_user_id', patientId);
    formData.append('remarks', remarks);

    try {
      const res = await fetch('http://localhost:8000/prescriptions/override', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ Prescription uploaded despite low stock.');
        setPrescriptions((prev) => [data, ...prev]);
        setFile(null);
        setRemarks('');
      } else {
        alert(data.detail?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Override upload error:', err);
      alert('❌ Something went wrong.');
    }
  };

  const previewPDF = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/prescriptions/view/${id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
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

  return (
    <Box sx={{ p: 4, fontFamily: 'Poppins', backgroundColor: '#f7f8f9', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#121a00', fontWeight: 600 }} align="center">
        Doctor Portal
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#495d00', fontWeight: 500 }}>
          🔍 Search for a Patient
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField label="Patient Name" value={patientName} onChange={(e) => setPatientName(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField label="Patient User ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSearch}
              sx={{ backgroundColor: '#121a00', height: '100%', fontWeight: 500, '&:hover': { backgroundColor: '#2c3a00' } }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {searched && (
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Typography variant="h6" mb={2} sx={{ color: '#678300' }}>
            📄 Upload a Prescription (PDF)
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              sx={{ borderColor: '#678300', color: '#678300', textTransform: 'none', fontWeight: 500, '&:hover': { backgroundColor: '#ccff00' } }}
            >
              Choose File
              <input type="file" hidden accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
            </Button>
            <Typography variant="body2">{file ? file.name : 'No file selected'}</Typography>
            <TextField
              label="Remarks (e.g., Fever, Cold)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              fullWidth
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!!lowStockWarning}
              sx={{ backgroundColor: '#121a00', color: '#fff', '&:hover': { backgroundColor: '#2c3a00' } }}
            >
              Upload
            </Button>
          </Box>
        </Paper>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        prescriptions.length > 0 && (
          <Grid container spacing={3}>
            {prescriptions.map((pres) => (
              <Grid item xs={12} sm={6} md={4} key={pres.id}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#495d00' }}>
                    Prescription
                  </Typography>
                  <Typography variant="body2"><strong>Doctor:</strong> {pres.doctor_name}</Typography>
                  <Typography variant="body2"><strong>Patient:</strong> {pres.patient_name}</Typography>
                  <Typography variant="body2"><strong>Note:</strong> {pres.remarks || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Date:</strong> {new Date(pres.created_at).toLocaleString()}</Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2, borderColor: '#678300', color: '#678300', textTransform: 'none', '&:hover': { backgroundColor: '#ccff00', borderColor: '#678300' } }}
                    onClick={() => previewPDF(pres.id)}
                  >
                    View PDF
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {lowStockWarning && (
        <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
          <DialogTitle>⚠️ Inventory Alert</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              The following medicines are currently below the recommended stock levels:
            </Typography>
            {lowStockWarning.map((item, idx) => (
              <Typography key={idx} sx={{ mb: 1 }}>
                • <strong>{item.medicine}</strong><br />
                &nbsp;&nbsp;Available: {item.available_quantity}<br />
                &nbsp;&nbsp;Minimum Required: {item.threshold}
              </Typography>
            ))}
            <Typography sx={{ mt: 2 }}>
              Would you like to revise the prescription or proceed anyway?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowDialog(false);
              setFile(null);
            }} color="warning">
              Revise
            </Button>
            <Button onClick={() => {
              setShowDialog(false);
              setLowStockWarning(null);
              handleUploadOverride();
            }} color="primary">
              Proceed Anyway
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default DoctorPortal;