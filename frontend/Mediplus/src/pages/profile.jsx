import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Divider } from '@mui/material';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get('http://localhost:8000/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (result.status === 200) {
          setUser(result.data);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Failed to fetch user info', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  if (loading) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontFamily="Poppins"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <Typography variant="h6" align="center" mt={6} fontFamily="Poppins">
        Please login to view your profile.
      </Typography>
    );
  }

  return (
    <Box
    sx={{
        minHeight: '100vh',
        backgroundColor: '#f7f8f9',
        backgroundImage: `radial-gradient(#bdd800 0.8px, transparent 0.8px)`,
        backgroundSize: '20px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        pt: 10,
        fontFamily: 'Poppins',
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          maxWidth: 420,
          width: '100%',
          height: '100%',
          margin: '10',
          borderRadius: 1,
          textAlign: 'center',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ color: '#121a00', fontWeight: 600 }}>
          User Profile
        </Typography>

        <Divider sx={{ my: 2, backgroundColor: '#a9d400' }} />

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          <strong style={{ color: '#678300' }}>Name:</strong> {user.name}
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          <strong style={{ color: '#678300' }}>Email:</strong> {user.email}
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          <strong style={{ color: '#678300' }}>Role:</strong> {user.role}
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          <strong style={{ color: '#678300' }}>User ID:</strong> {user.user_id}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile;
