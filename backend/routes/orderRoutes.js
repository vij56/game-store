const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getOrders,
  getOwnedGames,
  getLatestInvoiceLink,
  getPublicInvoiceOrder,
} = require("../controllers/orderController");

router.get("/invoice/public/:orderId", getPublicInvoiceOrder);

router.get("/", auth, getOrders);

// 🔥 NEW ROUTE
router.get("/owned", auth, getOwnedGames);
router.get("/invoice/latest-link", auth, getLatestInvoiceLink);

module.exports = router;
