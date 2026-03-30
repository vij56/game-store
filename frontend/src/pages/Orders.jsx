import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchOrders();
  }, []);

  const fetchOrders = async () => {
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
  };

  return (
    <div style={{ padding: "30px", color: "white" }}>
      <h1>Your Library 🎮</h1>

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
