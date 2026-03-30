import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Success() {
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLatestOrder();
  }, []);

  const fetchLatestOrder = async () => {
    const res = await fetch("http://localhost:5000/api/orders/latest", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return;

    const data = await res.json();
    setOrder(data);
  };

  // 📄 DOWNLOAD TXT
  const handleDownload = () => {
    const content = `
🎮 THANK YOU FOR YOUR PURCHASE!

Your Games:
${order.items.map((i) => "- " + i.game.title).join("\n")}

-------------------------------------

📌 INSTALLATION GUIDE:

1. Download the game from your library
2. Extract files using WinRAR / 7zip
3. Run setup.exe
4. Follow instructions

-------------------------------------

⚠️ NOTE:
This file is available only once.
Please save it securely.

Enjoy your game 🎉
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "Game_Instructions.txt";
    link.click();
  };

  const markAsDelivered = async () => {
    await fetch("http://localhost:5000/api/orders/delivered", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId: order._id }),
    });

    navigate("/cart");
  };

  if (!order) {
    return (
      <div style={{ padding: "40px", color: "white" }}>
        <h1>Payment Successful 🎉</h1>
        <p>No new delivery found</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1>🎉 Your Purchase is Ready</h1>

      <p>
        Thank you for your purchase. Please download the instructions document
        below.
      </p>

      <div style={{ marginTop: "20px" }}>
        <h3>Games:</h3>
        {order.items.map((item) => (
          <p key={item._id}></p>
        ))}
      </div>

      <button onClick={handleDownload} style={{ marginTop: "20px" }}>
        📄 Download Instructions
      </button>

      <button onClick={markAsDelivered} style={{ marginLeft: "10px" }}>
        Continue
      </button>
    </div>
  );
}
