const express = require("express");
const router = express.Router();

const {
  addGame,
  updateGame,
  deleteGame,
  getAllGamesAdmin,
} = require("../controllers/adminGameController");

const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/upload");
const Order = require("../models/Order");

// Get all games (admin)
router.get("/", auth, adminMiddleware, getAllGamesAdmin);

// Stats: total games sold + daily revenue
router.get("/stats", auth, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ status: "paid" });

    const totalGamesSold = orders.reduce((sum, o) => {
      return sum + o.items.reduce((s, i) => s + (i.quantity || 1), 0);
    }, 0);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

    // Daily revenue for last 7 days
    const now = new Date();
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const label = day.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      const revenue = orders
        .filter(
          (o) => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end,
        )
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      dailyRevenue.push({ label, revenue });
    }

    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt) >= todayStart,
    );
    const todayRevenue = todayOrders.reduce(
      (sum, o) => sum + (o.amount || 0),
      0,
    );

    res.json({
      totalGamesSold,
      totalRevenue,
      totalOrders: orders.length,
      todayRevenue,
      todayOrders: todayOrders.length,
      dailyRevenue,
    });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching stats" });
  }
});

// Upload image
router.post(
  "/upload-image",
  auth,
  adminMiddleware,
  upload.single("image"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
    const imageUrl = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  },
);

// Add game
router.post("/", auth, adminMiddleware, addGame);

// Update game
router.put("/:id", auth, adminMiddleware, updateGame);

// Delete game
router.delete("/:id", auth, adminMiddleware, deleteGame);

module.exports = router;
