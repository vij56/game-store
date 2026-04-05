const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();

app.use(cors({ origin: "*" }));

app.use(express.json());

// Serve uploaded images as static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/instructions/download", (req, res) => {
  const instructionsPath = path.join(__dirname, "..", "Instructions.pdf");

  if (!fs.existsSync(instructionsPath)) {
    return res.status(404).json({ msg: "Instructions PDF not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="Instructions.pdf"',
  );

  return res.sendFile(instructionsPath, (error) => {
    if (error && !res.headersSent) {
      return res.status(500).json({ msg: "Failed to send instructions PDF" });
    }
  });
});

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
