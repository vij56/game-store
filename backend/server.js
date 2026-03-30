const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();

app.use(
  cors({
    origin: "https://game-store-eta-rosy.vercel.app",
  }),
);

app.use(express.json());

app.use("/api/games", require("./routes/gameRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
