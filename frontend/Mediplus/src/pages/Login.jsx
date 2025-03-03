import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      
      // ✅ Redirect based on user role
      const user = JSON.parse(localStorage.getItem("user"));
      if (user.role === "patient") {
        navigate("/view-prescriptions");
      } else {
        navigate("/dashboard");
      }
    } catch {
      alert("Invalid credentials! Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="login-btn">Login</button>
          <button onClick={() => navigate("/signup")} className="login-btn">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
