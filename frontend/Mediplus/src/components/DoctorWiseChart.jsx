import React, { useEffect, useState } from 'react';
import { Paper, Typography } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const DoctorWiseChart = ({ token }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const res = await fetch('http://localhost:8000/analytics/prescriptions-by-doctor', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Failed to fetch doctor data:', err);
      }
    };
    fetchDoctorData();
  }, [token]);

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
      <Typography variant="h6" mb={2}>Prescriptions by Doctor</Typography>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="doctor_name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="total_uploaded" fill="#87aa00" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default DoctorWiseChart;