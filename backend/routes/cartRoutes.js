const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  addToCart,
  getCart,
  removeFromCart,
  updateQuantity,
} = require("../controllers/cartController");

router.post("/add", auth, addToCart);
router.get("/", auth, getCart);
router.post("/remove", auth, removeFromCart);
router.post("/update", auth, updateQuantity);

module.exports = router;
