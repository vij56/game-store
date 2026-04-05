const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  createPayPalOrder,
  capturePayPalOrder,
} = require("../controllers/paymentController");
const auth = require("../middleware/auth");

router.post("/create-order", auth, createOrder);
router.post("/verify", auth, verifyPayment);
router.post("/paypal/create-order", auth, createPayPalOrder);
router.post("/paypal/capture", auth, capturePayPalOrder);

module.exports = router;
