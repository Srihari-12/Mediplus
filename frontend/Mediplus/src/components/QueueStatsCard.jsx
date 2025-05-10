import React, { useEffect, useState } from 'react';
import { Paper, Typography, Grid } from '@mui/material';

const QueueStatsCard = ({ token }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:8000/dashboard/queue_stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error('Failed to fetch queue stats:', err);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <Paper elevation={4} sx={{ mb: 4, p: 3, borderRadius: 4, backgroundColor: '#ffffff' }}>
      <Typography variant="h6" mb={2} sx={{ fontWeight: 600 }}>Queue Stats (Today)</Typography>
      {stats && (
        <Grid container spacing={2}>
          {Object.entries(stats.status_counts).map(([status, count]) => (
            <Grid item xs={12} sm={6} md={4} key={status}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 3, backgroundColor: '#f5fbe7' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{status.replace('_', ' ').toUpperCase()}</Typography>
                <Typography variant="h5" color="primary.dark">{count}</Typography>
              </Paper>
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3, backgroundColor: '#e8f5e9' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Total Prescriptions</Typography>
              <Typography variant="h5" color="secondary.dark">{stats.total_pharmacy_prescriptions}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3, backgroundColor: '#e3f2fd' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Current Queue Length</Typography>
              <Typography variant="h5" color="info.dark">{stats.current_queue_length}</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default QueueStatsCard;