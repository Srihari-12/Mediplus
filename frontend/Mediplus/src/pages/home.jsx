import React from 'react';
import { Box, Typography, Button, Grid, Container } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealingIcon from '@mui/icons-material/Healing';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

const HomePage = () => {
  return (
    <Box sx={{ backgroundColor: '#f0f4f3', minHeight: '100vh', fontFamily: 'Poppins' }}>
      {/* Hero Section */}
      <Box
        sx={{
          backgroundColor: '#121a00',
          color: 'white',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" fontWeight={600} gutterBottom>
          MediPlus
        </Typography>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Seamless Prescription Management for Doctors, Patients, and Pharmacies
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{ backgroundColor: '#ccff00', color: '#121a00', fontWeight: 600, textTransform: 'none' }}
          href="/login"
        >
          Get Started
        </Button>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h4" align="center" fontWeight={600} mb={6} color="#121a00">
          Key Features
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box textAlign="center" p={3} borderRadius={3} bgcolor="white" boxShadow={3}>
              <LocalHospitalIcon sx={{ fontSize: 50, color: '#678300' }} />
              <Typography variant="h6" fontWeight={600} mt={2} mb={1}>Doctor Portal</Typography>
              <Typography variant="body2" color="text.secondary">
                Upload and manage patient prescriptions, search patients by name and ID.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box textAlign="center" p={3} borderRadius={3} bgcolor="white" boxShadow={3}>
              <HealingIcon sx={{ fontSize: 50, color: '#678300' }} />
              <Typography variant="h6" fontWeight={600} mt={2} mb={1}>Patient Portal</Typography>
              <Typography variant="body2" color="text.secondary">
                View and download prescriptions, send them for purchase and receive OTP.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box textAlign="center" p={3} borderRadius={3} bgcolor="white" boxShadow={3}>
              <PersonSearchIcon sx={{ fontSize: 50, color: '#678300' }} />
              <Typography variant="h6" fontWeight={600} mt={2} mb={1}>Pharmacist Portal</Typography>
              <Typography variant="body2" color="text.secondary">
                Access prescriptions, verify OTPs and update pickup status easily.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box textAlign="center" py={3} mt={4} bgcolor="#e6efe7" color="#495d00">
        <Typography variant="body2">
          &copy; {new Date().getFullYear()} MediPlus. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default HomePage;