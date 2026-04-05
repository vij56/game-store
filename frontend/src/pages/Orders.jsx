import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const instructionsUrl =
    "https://docs.google.com/document/u/0/d/1rVYpuHz0kTXA-D_HwRxRlU9KZbvLTUApmOnCDTMx6Ww/mobilebasic?pli=1";

  const token = localStorage.getItem("token");

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
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
    setOrders(data || []);
  }, [navigate, token]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      await fetchOrders();
    };

    loadOrders();
  }, [fetchOrders, navigate, token]);

  return (
    <div style={{ padding: "30px", color: "white" }}>
      <h1>Your Library 🎮</h1>
      <div style={{ marginBottom: "20px" }}>
        <a
          href={instructionsUrl}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#7dd3fc", fontWeight: 600 }}
        >
          Open Instructions
        </a>
      </div>

      {orders.length === 0 ? (
        <p>No purchases yet</p>
      ) : (
        orders.map((order) =>
          order.items.map((item) => (
            <div key={item._id} style={{ marginBottom: "20px" }}>
              <h3>{item.game.title}</h3>
              <img src={item.game.image} width="200" />
            </div>
          )),
        )
      )}
    </div>
  );
}
