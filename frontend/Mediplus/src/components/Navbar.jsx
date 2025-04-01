
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';



const Navbar = ({ isLoggedIn, username, onLogout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  

  const handleLogout = () => {
    localStorage.removeItem('token');
    handleClose();
    onLogout(); // notify parent
    navigate('/login');
  };
  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        color: '#121a00',
        fontFamily: 'Poppins, sans-serif',
        borderBottom: '1px solid #e0e0e0',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          variant={isMobile ? 'subtitle1' : 'h6'}
          sx={{ fontWeight: 600, cursor: 'pointer' }}
          onClick={() => navigate('/')}

        >
          Mediplus
          
        </Typography>

        <Box display="flex" alignItems="center" gap={-2}>
          {isLoggedIn ? (
            <>
              <IconButton 
              
              onClick={handleMenuClick} sx={{ color: '#121a00' }}>
                <AccountCircleIcon fontSize={isMobile ? 'medium' : 'large'} />
              </IconButton>
              {!isMobile && username && (
                <Typography variant="body1" sx={{ fontWeight: 400 }}>
                  {username}
                </Typography>
              )}
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                <MenuItem onClick={handleProfile}>Profile</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
              sx={{
                borderColor: '#121a00',
                color: '#121a00',
                textTransform: 'none',
                fontWeight: 500,
                fontFamily: 'Poppins, sans-serif',
              }}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
