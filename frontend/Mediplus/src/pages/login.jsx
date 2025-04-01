
import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from '@mui/material';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await fetch('http://localhost:8000/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        onLogin(); 
      } else {
        setError(data.detail || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f7f8f9',
        backgroundImage: `radial-gradient(#bdd800 0.8px,  transparent 0.8px )`,
        backgroundSize: '20px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        pt: 10,
        fontFamily: 'Poppins',
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={2} sx={{ p: 4, fontFamily: 'Poppins', borderRadius: 1 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Login to Mediplus
          </Typography>
  
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              c
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
              Login
            </Button>
          </Box>
  
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Don't have an account?{' '}
            <a
              href="/register"
              style={{
                color: '#121a00',
                textDecoration: 'underline',
              }}
            >
              Register
            </a>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
  
}

export default Login;