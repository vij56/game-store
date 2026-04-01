const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();

app.use(cors({ origin: "*" }));

app.use(express.json());

// Serve uploaded images as static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/games", require("./routes/gameRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/admin/games", require("./routes/adminGameRoutes"));

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
