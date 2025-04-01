import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  MenuItem,
} from '@mui/material';

const Signup = ({ onSignup }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      email,
      password,
      name,
      role,
    };

    try {
      const res = await fetch('http://localhost:8000/auth/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (res.ok) {
        onSignup(); // optional: redirect to login
      } else {
        setError(data.detail || 'Signup failed');
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
      console.error(err);
    }
  };

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
      <Container maxWidth="xs">
        <Paper elevation={2} sx={{ p: 4, fontFamily: 'Poppins', borderRadius: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Register to Mediplus
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TextField
              select
              label="Role"
              fullWidth
              margin="normal"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="pharmacist">Pharmacist</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>

            {error && (
              <Typography color="error" sx={{ mt: 1, fontSize: 14 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                backgroundColor: '#121a00',
                fontFamily: 'Poppins',
                '&:hover': {
                  backgroundColor: '#2c3a00',
                },
              }}
            >
              Sign Up
            </Button>
          </Box>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Already have an account?{' '}
            <a
              href="/login"
              style={{
                color: '#121a00',
                textDecoration: 'underline',
              }}
            >
              Login
            </a>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;
