import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

export default function Checkout() {
  const [cart, setCart] = useState({ items: [] });

  // ✅ NEW FORM STATE
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "", // ✅ NEW
    country: "",
    pincode: "",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    const res = await fetch("http://localhost:5000/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    const data = await res.json();
    setCart(data || { items: [] });
  };

  // 👇 ✅ PUT IT HERE (just below fetchCart)
  const updateQty = async (gameId, qty) => {
    if (qty < 1) return;

    const res = await fetch("http://localhost:5000/api/cart/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ gameId, quantity: qty }),
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    fetchCart(); // 🔥 refresh UI
  };

  const items = cart.items || [];

  const total = items.reduce((acc, item) => {
    return acc + (item.game?.salePrice || 0) * item.quantity;
  }, 0);

  // ✅ HANDLE INPUT CHANGE
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 PAYMENT
  const handlePayment = async () => {
    // ✅ VALIDATION
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.state || // ✅ NEW
      !form.country ||
      !form.pincode
    ) {
      alert("Please fill all details");
      return;
    }

    const res = await fetch("http://localhost:5000/api/payment/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: total }),
    });

    if (!res.ok) {
      alert("Failed to create order");
      return;
    }

    const order = await res.json();

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      order_id: order.id,

      handler: async function (response) {
        const verifyRes = await fetch(
          "http://localhost:5000/api/payment/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...response,
              ...form, // ✅ send form data
            }),
          },
        );

        if (verifyRes.ok) {
          // ✅ CLEAR CART BACKEND
          setCart({ items: [] });

          // ✅ REDIRECT TO SUCCESS PAGE
          navigate("/success");
        } else {
          alert("Payment failed ❌");
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Checkout</h1>

      <div className="checkout-grid">
        {/* 🧾 LEFT: FORM */}
        <div className="checkout-form">
          <h2>Shipping Details</h2>

          <input name="name" placeholder="Full Name" onChange={handleChange} />
          <input
            name="email"
            placeholder="Email Address"
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="Phone Number"
            onChange={handleChange}
          />
          <input name="address" placeholder="Address" onChange={handleChange} />
          <input name="city" placeholder="City" onChange={handleChange} />
          <input name="state" placeholder="State" onChange={handleChange} />
          <input name="country" placeholder="Country" onChange={handleChange} />
          <input name="pincode" placeholder="Pincode" onChange={handleChange} />
        </div>

        {/* 💰 RIGHT: ORDER SUMMARY */}
        <div className="checkout-summary">
          <h2>Order Summary</h2>

          {items.map((item) => (
            <div key={item.game._id} className="summary-item">
              <div>
                <p>{item.game.title}</p>

                {/* 🔥 QUANTITY CONTROLS */}
                <div className="qty-controls">
                  <button
                    onClick={() => updateQty(item.game._id, item.quantity - 1)}
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() => updateQty(item.game._id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ✅ TOTAL PER ITEM */}
              <span>₹{item.game.salePrice * item.quantity}</span>
            </div>
          ))}

          <div className="summary-total">
            <h3>Total</h3>
            <h3>₹{total}</h3>
          </div>

          <button className="pay-btn" onClick={handlePayment}>
            Pay Now 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
