import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import Navbar from "./components/Navbar";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Signup from "./pages/Signup";
import PrescriptionUpload from "./pages/Pharmacy";
import ViewPrescriptions from "./pages/ViewPrescription";
import PharmacyDashboard from "./pages/Pharmacy";
import PropTypes from "prop-types";

const PrivateRoute = ({ element }) => {
  const { token } = useAuthStore();
  return token ? element : <Navigate to="/login" />;
};

PrivateRoute.propTypes = {
  element: PropTypes.node.isRequired,
};

const App = () => (
  <Router>
    <Navbar />
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
      <Route path="/upload-prescription" element={<PrivateRoute element={<PrescriptionUpload />} />} />
      <Route path="/view-prescriptions" element={<PrivateRoute element={<ViewPrescriptions />} />} />
      <Route path="/pharmacy" element={<PrivateRoute element={<PharmacyDashboard />} />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  </Router>
);

export default App;


