import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

export default function Cart() {
  const [cart, setCart] = useState({ items: [] });
  const [games, setGames] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchCart();
    fetchGames();
  }, []);

  // 🛒 FETCH CART
  const fetchCart = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setCart(data || { items: [] });
    } catch (err) {
      console.error(err);
      setCart({ items: [] });
    }
  };

  // 🎮 FETCH ALL GAMES
  const fetchGames = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/games`);
      const data = await res.json();
      setGames(data || []);
    } catch (err) {
      console.error(err);
      setGames([]);
    }
  };

  // ➕ ADD TO CART
  const addToCart = async (gameId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ gameId }),
    });

    if (res.status === 401) {
      navigate("/login");
      return;
    }

    fetchCart();
  };

  // ✅ FILTER VALID ITEMS
  const items = (cart.items || []).filter((item) => item.game);

  const total = items.reduce((acc, item) => {
    return acc + (item.game?.salePrice || 0) * item.quantity;
  }, 0);

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>

      {items.length === 0 ? (
        <p>Cart is empty 🛒</p>
      ) : (
        <>
          {/* ✅ SMALL CARD GRID */}
          <div className="cart-grid">
            {items.map((item) => (
              <div className="cart-card" key={item.game._id}>
                <img src={item.game.image} alt={item.game.title} />

                <h4>{item.game.title}</h4>
                <p>₹{item.game.salePrice}</p>

                <div className="qty">Qty: {item.quantity}</div>
              </div>
            ))}
          </div>

          <h2>Total: ₹{total}</h2>

          <button
            className="checkout-btn"
            onClick={() => navigate("/checkout")}
            disabled={items.length === 0}
          >
            <span>Proceed to Checkout</span>
            <span className="arrow">→</span>
          </button>
        </>
      )}

      {/* ✅ SHOW ONLY IF CART HAS ITEMS */}
      {items.length > 0 && (
        <>
          <h2 style={{ marginTop: "40px" }}>Browse More Games 🎮</h2>

          <div className="game-row">
            <div className="scroll-track">
              {[...games, ...games].map((game, index) => (
                <div key={index} className="game-card">
                  <img src={game.image} alt={game.title} />

                  <h4>{game.title}</h4>
                  <p>₹{game.salePrice}</p>

                  <button onClick={() => addToCart(game._id)}>Buy Now</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
