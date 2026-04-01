const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  addToCart,
  getCart,
  removeFromCart,
  updateQuantity,
  decreaseQty,
  removeItem,
  clearCart,
} = require("../controllers/cartController");

// 🛒 CART ROUTES
router.get("/", auth, getCart);
router.post("/add", auth, addToCart);
router.post("/remove", auth, removeItem); // use removeItem
router.post("/update", auth, updateQuantity);
router.post("/decrease", auth, decreaseQty);
router.post("/clear", auth, clearCart);

module.exports = router;
