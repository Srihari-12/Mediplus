// AdminPortal.jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { BarChart } from '@mui/icons-material';
import PeakDayChart from '../components/PeakDayChart';
import DoctorWiseChart from '../components/DoctorWiseChart';
import QueueStatsCard from '../components/QueueStatsCard';
import InventoryUpload from '../components/InventoryUpload';

const AdminPortal = () => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('peak');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    setLoading(false); // placeholder for any initial async ops
  }, []);

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4} sx={{ fontFamily: 'Poppins', backgroundColor: '#f0f4e3', minHeight: '100vh' }}>
      <Typography variant="h4" textAlign="center" fontWeight={600} mb={4}>
        Admin Dashboard
      </Typography>

      <Box display="flex" justifyContent="center" gap={2} mb={4} flexWrap="wrap">
        <Button
          variant={view === 'peak' ? 'contained' : 'outlined'}
          onClick={() => setView('peak')}
          startIcon={<BarChart />}
        >
          Peak Days
        </Button>
        <Button
          variant={view === 'doctor' ? 'contained' : 'outlined'}
          onClick={() => setView('doctor')}
          startIcon={<BarChart />}
        >
          Doctor-Wise
        </Button>
      </Box>

      {view === 'peak' ? (
        <PeakDayChart token={token} />
      ) : (
        <DoctorWiseChart token={token} />
      )}

      <QueueStatsCard token={token} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      <InventoryUpload token={token} />
    </Box>
  );
};

export default AdminPortal;
