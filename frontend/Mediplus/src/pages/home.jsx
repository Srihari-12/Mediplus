import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Container,
  Paper,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealingIcon from '@mui/icons-material/Healing';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

const HomePage = () => {
  return (
    <Box sx={{ fontFamily: 'Poppins', backgroundColor: '#f0f4f3' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'radial-gradient(circle at top left, #121a00, #2c3a00 70%)',
          color: 'white',
          py: { xs: 10, md: 14 },
          px: 3,
          textAlign: 'center',
          borderBottomLeftRadius: { xs: 60, md: 100 },
          borderBottomRightRadius: { xs: 60, md: 100 },
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        <Box
          sx={{
            display: 'inline-block',
            px: 2.5,
            py: 0.6,
            backgroundColor: 'rgba(204, 255, 0, 0.12)',
            border: '1px solid #ccff00',
            borderRadius: 999,
            color: '#ccff00',
            fontWeight: 500,
            fontSize: '0.85rem',
            mb: 3,
            backdropFilter: 'blur(6px)',
          }}
        >
          Rediscover Seamless Healthcare
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            fontSize: { xs: '2rem', md: '3.2rem' },
            maxWidth: 720,
            mx: 'auto',
            mb: 2,
          }}
        >
          Need medicines? <br />
          A simple tap is all it takes
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontSize: '1.1rem',
            maxWidth: 600,
            mx: 'auto',
            color: 'rgba(255,255,255,0.85)',
            mb: 4,
          }}
        >
          Experience the future of pharmacy with our intelligent system. We help
          doctors, patients, and pharmacies connect instantly — all in one place.
        </Typography>

        <Button
          variant="contained"
          size="large"
          sx={{
            backgroundColor: '#ccff00',
            color: '#121a00',
            fontWeight: 600,
            textTransform: 'none',
            px: 5,
            py: 1.6,
            fontSize: '1rem',
            borderRadius: 3,
            boxShadow: '0 4px 14px rgba(204, 255, 0, 0.4)',
            '&:hover': {
              backgroundColor: '#a9d400',
              boxShadow: '0 6px 20px rgba(169, 212, 0, 0.4)',
            },
          }}
          href="/login"
        >
          Get Started
        </Button>
      </Box>

      {/* Feature Cards Section */}
      <Container sx={{ py: 10 }}>
        <Typography
          variant="h4"
          align="center"
          fontWeight={700}
          color="#121a00"
          mb={6}
        >
          What You Can Do
        </Typography>
        <Grid container spacing={4}>
          {[
            {
              icon: <LocalHospitalIcon sx={{ fontSize: 60 }} />,
              title: 'Doctor Portal',
              desc: 'Upload prescriptions, search patients by name or ID, and manage records effortlessly.',
            },
            {
              icon: <HealingIcon sx={{ fontSize: 60 }} />,
              title: 'Patient Portal',
              desc: 'Easily access and send prescriptions to pharmacies. Track fulfillment using OTPs.',
            },
            {
              icon: <PersonSearchIcon sx={{ fontSize: 60 }} />,
              title: 'Pharmacist Portal',
              desc: 'View received prescriptions, verify OTPs at pickup points, and manage status updates.',
            },
          ].map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                elevation={4}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 5,
                  height: '100%',
                  backgroundColor: 'white',
                  color: '#2c3a00',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Box
                  sx={{
                    color: '#678300',
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        textAlign="center"
        py={3}
        mt={6}
        bgcolor="#e6efe7"
        color="#495d00"
        borderTop="1px solid #d5e3d1"
      >
        <Typography variant="body2">
          &copy; {new Date().getFullYear()} MediPlus. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default HomePage;
