import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import GameCard from "../components/GameCard";
import "./Cart.css";
import toast from "react-hot-toast";
import { showAddedToCartToast } from "../utils/showAddedToCartToast";

export default function Checkout() {
  const [cart, setCart] = useState({ items: [] });
  const [games, setGames] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // 🔥 FORM STATE
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");

  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");

  // 🔥 SCROLL (same as cart page)
  const scrollRef = useRef(null);
  const isPointerDown = useRef(false);
  const isDraggingRef = useRef(false);
  const startY = useRef(0);
  const scrollStart = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // 🔥 CART ACTIONS
  const addToCart = async (gameId, game = null) => {
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

    showAddedToCartToast(game);
    fetchCart();
  };

  const decreaseQty = async (gameId) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/cart/decrease`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ gameId }),
    });

    fetchCart();
  };

  const removeItem = async (gameId) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/cart/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ gameId }),
    });

    fetchCart();
  };

  const fetchCart = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setCart(data || { items: [] });
  };

  // 🔥 FETCH DATA
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCart(data || { items: [] }))
      .catch(console.error);

    fetch(`${import.meta.env.VITE_API_URL}/api/games`)
      .then((res) => res.json())
      .then((data) => setGames(data || []))
      .catch(console.error);
  }, [navigate, token]);

  const items = (cart.items || []).filter((i) => i.game);
  const isCartEmpty = items.length === 0;

  const total = items.reduce(
    (acc, i) => acc + (i.game?.salePrice || 0) * i.quantity,
    0,
  );

  // 🔥 AUTO SCROLL
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

  // 🔥 DRAG
  const handleMouseDown = (e) => {
    isPointerDown.current = true;
    isDraggingRef.current = false;
    setIsDragging(false);

    startY.current = e.pageY;
    scrollStart.current = scrollRef.current.scrollTop;
  };

  const handleMouseMove = (e) => {
    if (!isPointerDown.current) return;

    const walk = e.pageY - startY.current;

    if (Math.abs(walk) > 5) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }

    scrollRef.current.scrollTop = scrollStart.current - walk;
  };

  const stopDragging = () => {
    isPointerDown.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // 🔥 SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isCartEmpty) {
      toast.error("Add at least one game to proceed");
      return;
    }

    if (
      !address.trim() ||
      !country.trim() ||
      !state.trim() ||
      !city.trim() ||
      !pincode.trim() ||
      !phone.trim()
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      // 🔥 CREATE ORDER
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payment/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: total }),
        },
      );

      const data = await res.json();

      // 🔥 OPEN RAZORPAY
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "Game Store",
        description: "Game Purchase",
        order_id: data.id,

        handler: async function (response) {
          const verifyRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/payment/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(response),
            },
          );

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            // 🔥 CLEAR CART
            const clearRes = await fetch(
              `${import.meta.env.VITE_API_URL}/api/cart/clear`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (!clearRes.ok) {
              toast.error("Payment done, but cart clear failed");
              return;
            }

            flushSync(() => setShowSuccessModal(true));
          } else {
            toast.error("Payment verification failed ❌");
          }
        },

        prefill: {
          name: "User",
          contact: phone,
        },

        theme: {
          color: "#00eaff",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Payment failed ❌");
    }
  };

  return (
    <div className="cart-container">
      {showSuccessModal &&
        createPortal(
          <div className="toast-backdrop">
            <div className="toast-modal">
              <h2>Payment Successful 🎉</h2>
              <p>Your order has been placed successfully!</p>
              <div className="toast-actions">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate("/success");
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      <div className="checkout-layout checkout-three-layout">
        <section className="checkout-main">
          <div className="cart-panel-header">
            <p className="cart-kicker">CHECKOUT</p>
            <h1>Review your items</h1>
            <p className="cart-panel-copy">
              Finalize your selected games on the left before completing
              payment.
            </p>
          </div>

          <div className="cart-grid">
            {items.map((item) => (
              <div className="cart-item" key={item.game._id}>
                <img src={item.game.image} alt="" />

                <h3 className="cart-title">{item.game.title}</h3>

                <p className="cart-price">₹{item.game.salePrice}</p>

                <div className="quantity-control">
                  <button onClick={() => decreaseQty(item.game._id)}>-</button>

                  <span>{item.quantity}</span>

                  <button onClick={() => addToCart(item.game._id)}>+</button>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.game._id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="checkout-sidebar">
          <div className="checkout-form-card">
            <div className="browse-panel-header">
              <p className="cart-kicker">PAYMENT DETAILS</p>
              <h2>Secure checkout</h2>
              <p className="cart-panel-copy">
                Fill in your delivery details and continue to Razorpay.
              </p>
            </div>

            <div className="checkout-total-row">
              <span>Total Amount</span>
              <strong>₹{total}</strong>
            </div>

            <form onSubmit={handleSubmit} className="checkout-form-panel">
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isCartEmpty}
              />

              <select
                value={country}
                onChange={(e) => {
                  const selected = Country.getAllCountries().find(
                    (c) => c.name === e.target.value,
                  );
                  if (!selected) return;

                  setCountry(selected.name);
                  setCountryCode(selected.isoCode);
                  setState("");
                  setCity("");
                  setStateCode("");
                }}
                disabled={isCartEmpty}
              >
                <option value="">Country</option>
                {Country.getAllCountries().map((c) => (
                  <option key={c.isoCode} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={state}
                onChange={(e) => {
                  const selected = State.getStatesOfCountry(countryCode).find(
                    (s) => s.name === e.target.value,
                  );
                  if (!selected) return;

                  setState(selected.name);
                  setStateCode(selected.isoCode);
                  setCity("");
                }}
                disabled={isCartEmpty || !countryCode}
              >
                <option value="">State</option>
                {State.getStatesOfCountry(countryCode).map((s) => (
                  <option key={s.isoCode} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={isCartEmpty || !stateCode}
              >
                <option value="">City</option>
                {City.getCitiesOfState(countryCode, stateCode).map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                disabled={isCartEmpty}
              />

              <input
                type="text"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isCartEmpty}
              />

              <button
                type={isCartEmpty ? "button" : "submit"}
                className="btn checkout-submit-btn"
                onClick={isCartEmpty ? () => navigate("/") : undefined}
              >
                {isCartEmpty ? "Add games to continue" : "Proceed to Payment →"}
              </button>
            </form>
          </div>
        </aside>

        <aside className="suggestion-section checkout-browse-section">
          <div className="browse-panel-header">
            <p className="cart-kicker">DISCOVER MORE</p>
            <h2>Browse More Games 🎮</h2>
            <p className="cart-panel-copy">
              Explore more titles while your checkout details are ready.
            </p>
          </div>

          <div
            className="game-column"
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
          >
            <div className="scroll-column">
              {[...games, ...games].map((game, index) => (
                <div key={index} className="column-wrapper">
                  <GameCard
                    game={game}
                    onAddToCart={(g) => addToCart(g._id, g)}
                    disableClick={isDragging}
                    dragging={isDragging}
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
