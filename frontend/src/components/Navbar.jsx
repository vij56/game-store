import "./Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="navbar">
      <div className="logo" onClick={() => navigate("/")}>
        🎮 GameStore
      </div>

      <div className="nav-right">
        {!isAuthPage && (
          <>
            {!token ? (
              <>
                <button onClick={() => navigate("/login")}>Login</button>
                <button onClick={() => navigate("/register")}>Register</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/cart")}>Cart 🛒</button>
                <button onClick={handleLogout}>Logout</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
