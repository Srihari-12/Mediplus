import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo">
        Mediplus
      </Link>

      <div className="navbar__right">
        {user ? (
          <>
            <span className="navbar__user">Hello, {user.name}</span>
            <button onClick={handleLogout} className="navbar__btn">Logout</button>
          </>
        ) : (
          <Link to="/login" className="navbar__btn">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
