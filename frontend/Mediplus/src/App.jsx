import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/login';
import Signup from './pages/signup';
import Profile from './pages/profile';
import PatientPortal from './pages/patient';
import PharmacistPortal from './pages/pharmacist'; 
import DoctorPortal from './pages/doctor';
import HomePage from './pages/home';
import AdminDashboard from './pages/admin';

function AppWrapper() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserInfo = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setIsLoggedIn(true);
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch user info', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const data = await fetchUserInfo();

    if (data?.role === 'doctor') navigate('/doctor');
    else if (data?.role === 'patient') navigate('/patient');
    else if (data?.role === 'pharmacist') navigate('/pharmacist');
    else if (data?.role === 'admin') navigate('/admin');
    else navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/login');
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  if (loading) return null;

  return (
    <>
      <Navbar
        isLoggedIn={isLoggedIn}
        username={user?.name}
        onLogout={handleLogout}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Signup onSignup={handleSignup} />} />

        {/* Protected Routes Based on Roles */}
        {isLoggedIn && user?.role === 'doctor' && (
          <Route path="/doctor" element={<DoctorPortal />} />
        )}

        {isLoggedIn && user?.role === 'patient' && (
          <Route path="/patient" element={<PatientPortal />} />
        )}

        {isLoggedIn && user?.role === 'pharmacist' && (
          <Route path="/pharmacist" element={<PharmacistPortal />} />
        )}

        {isLoggedIn && user?.role === 'admin' && (
          <Route path="/admin" element={<AdminDashboard />} />
        )}

        {/* Fallback Routes */}
        <Route
          path="/profile"
          element={isLoggedIn ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
