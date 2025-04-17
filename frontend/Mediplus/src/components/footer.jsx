import React from 'react';
import { Box, Typography, Link, Divider } from '@mui/material';

const Footer = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#121a00',
        color: '#ccff00',
        mt: 6,
        py: 3,
        fontFamily: 'Poppins',
        textAlign: 'center',
      }}
    >
      <Divider sx={{ borderColor: '#2c3a00', mb: 2 }} />

      <Typography variant="body2" sx={{ mb: 1 }}>
        © {new Date().getFullYear()} MediPlus. All rights reserved.
      </Typography>

      <Typography variant="body2">
        Made with ❤️ for healthcare. |{' '}
        <Link
          href="https://github.com/Srihari-12/Mediplus"
          target="_blank"
          rel="noopener"
          sx={{ color: '#a9d400', textDecoration: 'none', fontWeight: 500 }}
        >
          About
        </Link>{' '}
        |{' '}
        <Link
          href="mailto:sriharivenkateswaran12@gmail.com"
          sx={{ color: '#a9d400', textDecoration: 'none', fontWeight: 500 }}
        >
          Contact
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;
