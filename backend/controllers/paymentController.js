const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

exports.createOrder = async (req, res) => {
  const { amount } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: "Order creation failed" });
  }
};

exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, msg: "Invalid payment" });
  }

  const cart = await Cart.findOne({ user: req.user.id }).populate("items.game");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, msg: "Cart is empty" });
  }

  const total = cart.items.reduce(
    (acc, item) => acc + item.game.salePrice * item.quantity,
    0,
  );

  const newOrder = await Order.create({
    user: req.user.id,
    items: cart.items.map((item) => ({
      game: item.game._id,
      quantity: item.quantity,
    })),
    amount: total,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    delivered: false,
  });

  // CLEAR CART
  cart.items = [];
  await cart.save();

  res.json({
    success: true,
    orderId: newOrder._id,
    order: newOrder,
  });
};
