const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getOrders, getOwnedGames } = require("../controllers/orderController");

router.get("/", auth, getOrders);

// 🔥 NEW ROUTE
router.get("/owned", auth, getOwnedGames);

module.exports = router;
