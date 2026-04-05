import "./Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FaShoppingCart } from "react-icons/fa";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [count, setCount] = useState(0);

  let user = null;
  if (token) {
    try {
      user = jwtDecode(token);
    } catch {
      localStorage.removeItem("token");
    }
  }

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const fetchCartCount = useCallback(async () => {
    if (!token) {
      setCount(0);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Token expired or invalid");
          localStorage.removeItem("token");
        }
        return;
      }

      const data = await res.json();

      const total = (data.items || []).reduce((acc, i) => acc + i.quantity, 0);

      setCount(total);
    } catch (err) {
      console.error("Cart fetch error:", err);
    }
  }, [token, setCount]);

  useEffect(() => {
    const loadCart = async () => {
      await fetchCartCount();
    };

    loadCart();

    const interval = setInterval(() => {
      loadCart();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchCartCount]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="navbar">
      <div className="logo" onClick={() => navigate("/")}>
        <img
          src="/game-skull-logo-f943fd59-cd07-4a42-bf66-63e21f913aee.jpg"
          alt="ByteArena Shop logo"
          className="logo-image"
        />
        <span className="logo-text">ByteArena Shop</span>
      </div>

      <div className="nav-right">
        {!isAuthPage && (
          <>
            {!token ? (
              <>
                <button className="btn" onClick={() => navigate("/login")}>
                  Login
                </button>
                <button className="btn" onClick={() => navigate("/register")}>
                  Register
                </button>
              </>
            ) : (
              <>
                {user && (
                  <span className="username">
                    Hi, {user.username || user.name || user.email || "Player"}
                  </span>
                )}

                <button
                  className="btn cart-btn"
                  id="cart-icon"
                  onClick={() => navigate("/cart")}
                >
                  <FaShoppingCart className="cart-icon" />
                  {count > 0 && <span className="cart-badge">{count}</span>}
                </button>

                <button className="btn" onClick={() => navigate("/library")}>
                  My Library
                </button>

                <button className="btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
