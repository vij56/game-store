import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";
import toast from "react-hot-toast";
import GameCard from "../components/GameCard";
import { showAddedToCartToast } from "../utils/showAddedToCartToast";

export default function Cart() {
  const [cart, setCart] = useState({ items: [] });
  const [games, setGames] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const scrollRef = useRef(null);
  const isPointerDown = useRef(false);
  const startY = useRef(0);
  const scrollStart = useRef(0);
  const isDraggingRef = useRef(false);
  const hasMoved = useRef(false);

  const fetchCart = useCallback(async () => {
    const tokenValue = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${tokenValue}` },
    });

    const data = await res.json();
    setCart(data || { items: [] });
  }, []);

  const fetchGames = useCallback(async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/games`);
    const data = await res.json();
    setGames(data || []);
  }, []);

  useEffect(() => {
    const loadCartAndGames = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      await fetchCart();
      await fetchGames();
    };

    loadCartAndGames();
  }, [fetchCart, fetchGames, navigate, token]);

  const handlePointerDown = (event) => {
    if (event.target.closest("button, a, input, textarea, select")) {
      return;
    }

    const pageY = event.pageY;
    isPointerDown.current = true;
    hasMoved.current = false;
    startY.current = pageY;
    scrollStart.current = scrollRef.current?.scrollTop || 0;
    isDraggingRef.current = true;
    setIsDragging(false);
  };

  const handlePointerMove = (event) => {
    if (!isPointerDown.current || !scrollRef.current) return;

    const walk = event.pageY - startY.current;

    if (Math.abs(walk) > 5) {
      hasMoved.current = true;
      setIsDragging(true);
    }

    scrollRef.current.scrollTop = scrollStart.current - walk;
  };

  const releasePointer = () => {
    isPointerDown.current = false;
    isDraggingRef.current = false;

    if (hasMoved.current) {
      setTimeout(() => setIsDragging(false), 0);
    }

    hasMoved.current = false;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationFrame;

    const scroll = () => {
      if (!isDraggingRef.current) {
        el.scrollTop += 0.5;

        if (el.scrollTop >= el.scrollHeight / 2) {
          el.scrollTop = 0;
        }
      }

      animationFrame = requestAnimationFrame(scroll);
    };

    scroll();

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const addToCart = async (gameId, game = null) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameId }),
      });

      if (!res.ok) {
        toast.error("Failed to add");
        return;
      }

      showAddedToCartToast(game, {
        showContinueShopping: false,
        showGoToCart: false,
      });
      await fetchCart();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const increaseQty = async (gameId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameId }),
      });

      if (!res.ok) {
        toast.error("Failed to update quantity");
        return;
      }

      await fetchCart();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const decreaseQty = async (gameId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cart/decrease`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ gameId }),
        },
      );

      if (!res.ok) {
        toast.error("Failed to update quantity");
        return;
      }

      await fetchCart();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const items = (cart.items || []).filter((i) => i.game);

  const total = items.reduce(
    (acc, i) => acc + (i.game?.salePrice || 0) * i.quantity,
    0,
  );

  return (
    <div className="cart-container">
      <div className="cart-layout">
        <section className="cart-main">
          <div className="cart-panel-header">
            <h1 className="modern-hero-title">
              {items.length === 0 ? "Cart is empty 🛒" : "Your Cart"}
            </h1>
            <p className="cart-panel-copy modern-hero-subtitle">
              {items.length === 0
                ? "Your selected games will appear here once you add them from the store."
                : "Review your selected games and continue when you are ready to check out."}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="empty-cart empty-cart-card">
              <p>No games in your cart yet.</p>
            </div>
          ) : (
            <>
              <div className="cart-grid">
                {items.map((item) => (
                  <div className="cart-item" key={item.game._id}>
                    <img src={item.game.image} alt="" />

                    <h3 className="cart-title">{item.game.title}</h3>

                    <p className="cart-price">₹{item.game.salePrice}</p>

                    <div className="quantity-control">
                      <button onClick={() => decreaseQty(item.game._id)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => increaseQty(item.game._id)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <h2>Total: ₹{total}</h2>

                <button
                  className="checkout-btn"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout →
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="suggestion-section cart-suggestion-section">
          <div className="browse-panel-header">
            <h2 className="modern-hero-title modern-hero-title--compact">
              Browse More Games 🎮
            </h2>
            <p className="cart-panel-copy modern-hero-subtitle modern-hero-subtitle--compact">
              Explore more titles.
            </p>
          </div>

          <div
            className="game-column"
            ref={scrollRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={releasePointer}
            onPointerLeave={releasePointer}
            onPointerCancel={releasePointer}
          >
            <div className="scroll-column">
              {[...games, ...games].map((game, index) => (
                <div key={index} className="column-wrapper">
                  <GameCard
                    game={game}
                    onAddToCart={undefined}
                    disableClick={true}
                    dragging={isDragging}
                    titleTopPriceBottom={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
