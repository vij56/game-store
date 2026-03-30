const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getOrders,
  getOwnedGames,
  markDelivered,
  getLatestOrder,
} = require("../controllers/orderController");

router.get("/", auth, getOrders);

// 🔥 NEW ROUTE
router.get("/owned", auth, getOwnedGames);
router.get("/latest", auth, getLatestOrder);
router.post("/delivered", auth, markDelivered);

module.exports = router;
