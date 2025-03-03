import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div>
      <h2>Welcome, {user?.username}</h2>
      <button onClick={logout}>Logout</button>
      <button onClick={() => navigate("/upload-prescription")}>Upload Prescription</button>
      <button onClick={() => navigate("/view-prescriptions")}>View Prescriptions</button>
    </div>
  );
};

export default Dashboard;
