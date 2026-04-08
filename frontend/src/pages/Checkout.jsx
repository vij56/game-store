import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import GameCard from "../components/GameCard";
import "./Cart.css";
import toast from "react-hot-toast";
import { showAddedToCartToast } from "../utils/showAddedToCartToast";

const PAYPAL_CURRENCY_CONFIG = {
  INR: { rate: 1, symbol: "₹" },
  USD: { rate: 0.012, symbol: "$" },
  EUR: { rate: 0.011, symbol: "€" },
  GBP: { rate: 0.0094, symbol: "£" },
  AUD: { rate: 0.018, symbol: "A$" },
  CAD: { rate: 0.016, symbol: "C$" },
};

const COUNTRY_TO_PAYPAL_CURRENCY = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  AU: "AUD",
  CA: "CAD",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
};

const PAYPAL_CHECKOUT_ENABLED = false;
const SUCCESS_REDIRECT_SECONDS = 4;

export default function Checkout() {
  const [cart, setCart] = useState({ items: [] });
  const [games, setGames] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successRedirectCountdown, setSuccessRedirectCountdown] = useState(
    SUCCESS_REDIRECT_SECONDS,
  );
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [isCreatingRazorpayOrder, setIsCreatingRazorpayOrder] = useState(false);
  const [razorpayCooldown, setRazorpayCooldown] = useState(0);
  const [paypalCurrency, setPaypalCurrency] = useState("INR");
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalStatus, setPaypalStatus] = useState("idle");
  const [paypalStatusMessage, setPaypalStatusMessage] = useState("");

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
  const paypalButtonsRef = useRef(null);

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

    showAddedToCartToast(game, {
      showContinueShopping: false,
      showGoToCart: false,
    });
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

  const selectedPaypalCurrency =
    PAYPAL_CURRENCY_CONFIG[paypalCurrency] || PAYPAL_CURRENCY_CONFIG.INR;
  const convertedPayPalTotal = total * selectedPaypalCurrency.rate;

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

  const showCheckoutPopup = (
    title,
    message,
    variant = "warning",
    duration = 1200,
  ) => {
    toast.dismiss();

    const iconClass =
      variant === "error" ? "toast-error-icon" : "toast-success-icon";
    const iconLabel = variant === "error" ? "×" : "!";

    const toastId = toast.custom(
      () => (
        <div className="toast-backdrop">
          <div className="toast-modal toast-modal--compact">
            <div className={iconClass}>{iconLabel}</div>
            <h2>{title}</h2>
            <p>{message}</p>
          </div>
        </div>
      ),
      {
        duration,
        position: "top-left",
        style: {
          position: "fixed",
          inset: 0,
          transform: "none",
          background: "transparent",
          boxShadow: "none",
          padding: 0,
          margin: 0,
          maxWidth: "100vw",
          width: "100vw",
          height: "100vh",
        },
      },
    );

    setTimeout(() => toast.dismiss(toastId), duration);
    setTimeout(() => toast.remove(toastId), duration + 800);
  };

  const showCheckoutValidationPopup = (
    title = "Missing Details",
    message = "Please complete all checkout fields before payment.",
  ) => {
    showCheckoutPopup(title, message, "warning", 1100);
  };

  const showPayPalFailurePopup = (
    message = "Please try again in a few seconds.",
  ) => {
    showCheckoutPopup("PayPal Payment Failed", message, "error", 1900);
  };

  const showRazorpayFailurePopup = (
    message = "Please wait a few seconds and try again.",
  ) => {
    showCheckoutPopup("Razorpay Request Failed", message, "error", 2200);
  };

  useEffect(() => {
    if (!PAYPAL_CHECKOUT_ENABLED && paymentMethod !== "razorpay") {
      setPaymentMethod("razorpay");
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (!showSuccessModal) return;

    setSuccessRedirectCountdown(SUCCESS_REDIRECT_SECONDS);

    const timer = setTimeout(() => {
      setShowSuccessModal(false);
      navigate("/success");
    }, SUCCESS_REDIRECT_SECONDS * 1000);

    return () => clearTimeout(timer);
  }, [showSuccessModal, navigate]);

  useEffect(() => {
    if (!showSuccessModal || successRedirectCountdown <= 1) return;

    const timer = setTimeout(() => {
      setSuccessRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showSuccessModal, successRedirectCountdown]);

  useEffect(() => {
    if (razorpayCooldown <= 0) return;

    const timer = setTimeout(() => {
      setRazorpayCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [razorpayCooldown]);

  const isCheckoutFormValid = () => {
    if (isCartEmpty) return false;
    return (
      address.trim() &&
      country.trim() &&
      state.trim() &&
      city.trim() &&
      pincode.trim() &&
      phone.trim()
    );
  };

  useEffect(() => {
    if (!PAYPAL_CHECKOUT_ENABLED) return;
    if (paymentMethod !== "paypal") return;

    setPaypalStatusMessage("");

    const existingScript = document.querySelector(
      "script[data-paypal-sdk='true']",
    );

    if (existingScript && existingScript.dataset.currency !== paypalCurrency) {
      existingScript.remove();
      setPaypalReady(false);
      if (window.paypal) {
        try {
          delete window.paypal;
        } catch {
          window.paypal = undefined;
        }
      }
    }

    if (window.paypal) {
      setPaypalReady(true);
      setPaypalStatus("ready");
      return;
    }

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setPaypalStatus("missing-config");
      setPaypalStatusMessage(
        "PayPal is not configured. Add VITE_PAYPAL_CLIENT_ID in frontend .env",
      );
      return;
    }

    setPaypalStatus("loading");

    const reusableScript = document.querySelector(
      "script[data-paypal-sdk='true']",
    );
    if (reusableScript) {
      reusableScript.addEventListener("load", () => {
        setPaypalReady(true);
        setPaypalStatus("ready");
      });
      reusableScript.addEventListener("error", () => {
        setPaypalStatus("error");
        setPaypalStatusMessage("Failed to load PayPal SDK");
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${paypalCurrency}`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.dataset.currency = paypalCurrency;
    script.onload = () => {
      setPaypalReady(true);
      setPaypalStatus("ready");
    };
    script.onerror = () => {
      showPayPalFailurePopup("Failed to load PayPal gateway.");
      setPaypalStatus("error");
      setPaypalStatusMessage("Failed to load PayPal SDK");
    };
    document.body.appendChild(script);
  }, [paymentMethod, paypalCurrency]);

  useEffect(() => {
    if (!PAYPAL_CHECKOUT_ENABLED) return;
    if (paymentMethod !== "paypal") return;
    if (!paypalReady || !window.paypal || !paypalButtonsRef.current) return;

    paypalButtonsRef.current.innerHTML = "";

    window.paypal
      .Buttons({
        style: {
          layout: "vertical",
          shape: "pill",
          color: "gold",
          label: "paypal",
        },
        createOrder: async () => {
          if (!isCheckoutFormValid()) {
            showCheckoutValidationPopup(
              "Complete Checkout Details",
              "Please fill all required fields before using PayPal.",
            );
            throw new Error("FORM_INCOMPLETE");
          }

          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/payment/paypal/create-order`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ currency: paypalCurrency }),
            },
          );

          const data = await response.json();
          if (!response.ok || !data.id) {
            throw new Error(data.msg || "Unable to create PayPal order");
          }

          return data.id;
        },
        onApprove: async (data) => {
          const captureRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/payment/paypal/capture`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ orderId: data.orderID }),
            },
          );

          const captureData = await captureRes.json();
          if (!captureRes.ok || !captureData.success) {
            showPayPalFailurePopup(
              captureData.msg || "Unable to capture payment.",
            );
            return;
          }

          await fetchCart();
          flushSync(() => setShowSuccessModal(true));
        },
        onError: (error) => {
          if (error?.message === "FORM_INCOMPLETE") return;
          showPayPalFailurePopup("Your PayPal payment could not be completed.");
        },
      })
      .render(paypalButtonsRef.current)
      .catch(() => {
        setPaypalStatus("error");
        setPaypalStatusMessage("Unable to render PayPal button");
      });
  }, [
    paymentMethod,
    paypalReady,
    token,
    paypalCurrency,
    isCartEmpty,
    address,
    country,
    state,
    city,
    pincode,
    phone,
  ]);

  // 🔥 SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod !== "razorpay") return;
    if (isCreatingRazorpayOrder) return;
    if (razorpayCooldown > 0) return;

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
      showCheckoutValidationPopup(
        "Complete Checkout Details",
        "Please fill all required fields before proceeding with Razorpay.",
      );
      return;
    }

    try {
      setIsCreatingRazorpayOrder(true);

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
      if (!res.ok || !data?.id) {
        if (res.status === 429) {
          setRazorpayCooldown(5);
        }
        showRazorpayFailurePopup(
          data?.msg || "Unable to start Razorpay payment right now.",
        );
        setIsCreatingRazorpayOrder(false);
        return;
      }

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

          setIsCreatingRazorpayOrder(false);
        },

        modal: {
          ondismiss: () => {
            setIsCreatingRazorpayOrder(false);
          },
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
      showRazorpayFailurePopup("Unable to start Razorpay payment right now.");
      setIsCreatingRazorpayOrder(false);
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
              <p>Redirecting in {successRedirectCountdown} seconds...</p>
            </div>
          </div>,
          document.body,
        )}
      <div className="checkout-layout checkout-three-layout">
        <section className="checkout-main">
          <div className="cart-panel-header">
            <p className="cart-kicker">CHECKOUT</p>
            <h1 className="modern-hero-title">Review your items</h1>
            <p className="cart-panel-copy modern-hero-subtitle">
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

                  {/* Add to Cart button hidden as per requirements */}
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
                Fill in your delivery details and continue with Razorpay.
              </p>
            </div>

            <div className="payment-method-row">
              <label
                className={`payment-method-option${paymentMethod === "razorpay" ? " active" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                />
                <span>Razorpay</span>
              </label>
              {PAYPAL_CHECKOUT_ENABLED && (
                <label
                  className={`payment-method-option${paymentMethod === "paypal" ? " active" : ""}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentMethod === "paypal"}
                    onChange={() => setPaymentMethod("paypal")}
                  />
                  <span>PayPal</span>
                </label>
              )}
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
                  setPaypalCurrency(
                    COUNTRY_TO_PAYPAL_CURRENCY[selected.isoCode] || "INR",
                  );
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

              {paymentMethod === "razorpay" || !PAYPAL_CHECKOUT_ENABLED ? (
                <button
                  type={isCartEmpty ? "button" : "submit"}
                  className="btn checkout-submit-btn"
                  onClick={
                    isCartEmpty ||
                    isCreatingRazorpayOrder ||
                    razorpayCooldown > 0
                      ? () => {
                          if (isCartEmpty) navigate("/");
                        }
                      : undefined
                  }
                  disabled={isCreatingRazorpayOrder || razorpayCooldown > 0}
                >
                  {isCartEmpty
                    ? "Add games to continue"
                    : isCreatingRazorpayOrder
                      ? "Opening Razorpay..."
                      : razorpayCooldown > 0
                        ? `Try again in ${razorpayCooldown}s`
                        : "Proceed with Razorpay →"}
                </button>
              ) : (
                <div className="paypal-section">
                  <div className="paypal-shell-head">
                    <strong>Pay with PayPal</strong>
                    <span>Use your PayPal account or supported cards</span>
                  </div>
                  <div className="paypal-currency-row">
                    <label htmlFor="paypal-currency">PayPal currency</label>
                    <select
                      id="paypal-currency"
                      value={paypalCurrency}
                      onChange={(e) => setPaypalCurrency(e.target.value)}
                      disabled={isCartEmpty}
                    >
                      {Object.keys(PAYPAL_CURRENCY_CONFIG).map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="paypal-conversion-hint">
                    You pay {selectedPaypalCurrency.symbol}
                    {convertedPayPalTotal.toFixed(2)} {paypalCurrency}
                  </p>
                  <div className="paypal-buttons" ref={paypalButtonsRef} />
                  {paypalStatus === "loading" && (
                    <p className="paypal-status">Loading PayPal...</p>
                  )}
                  {paypalStatus === "missing-config" && (
                    <p className="paypal-status error">{paypalStatusMessage}</p>
                  )}
                  {paypalStatus === "error" && (
                    <p className="paypal-status error">
                      {paypalStatusMessage || "PayPal unavailable"}
                    </p>
                  )}
                </div>
              )}
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
                    onAddToCart={undefined}
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
