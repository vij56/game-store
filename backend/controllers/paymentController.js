const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");

const PAYPAL_BASE_URL =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const PAYPAL_CURRENCY_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AUD: 0.018,
  CAD: 0.016,
};

const SUPPORTED_PAYPAL_CURRENCIES = Object.keys(PAYPAL_CURRENCY_RATES);

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are missing");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Unable to get PayPal token");
  }

  return data.access_token;
}

exports.createOrder = async (req, res) => {
  const { amount } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
    });

    res.json(order);
  } catch (err) {
    const errorDescription =
      err?.error?.description || err?.description || "Order creation failed";
    const isTooManyRequests = /too many requests/i.test(errorDescription);

    res.status(isTooManyRequests ? 429 : 500).json({
      msg: isTooManyRequests
        ? "Too many payment requests. Please wait a few seconds and try again."
        : errorDescription,
    });
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
  const purchasedGameIds = cart.items.map((item) => item.game._id);

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

  await User.findByIdAndUpdate(req.user.id, {
    $pull: { libraryRevokedGames: { $in: purchasedGameIds } },
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

exports.createPayPalOrder = async (req, res) => {
  try {
    const requestedCurrency = (req.body?.currency || "INR").toUpperCase();
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.game",
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ msg: "Cart is empty" });
    }

    const total = cart.items.reduce(
      (acc, item) => acc + item.game.salePrice * item.quantity,
      0,
    );

    const currency = SUPPORTED_PAYPAL_CURRENCIES.includes(requestedCurrency)
      ? requestedCurrency
      : "INR";
    const conversionRate = PAYPAL_CURRENCY_RATES[currency] || 1;
    const convertedTotal = Math.max(total * conversionRate, 0.01);
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: convertedTotal.toFixed(2),
            },
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      return res.status(500).json({ msg: "PayPal order creation failed" });
    }

    res.json({
      id: data.id,
      currency,
      amount: convertedTotal.toFixed(2),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "PayPal order creation failed" });
  }
};

exports.capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, msg: "Order ID required" });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.game",
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, msg: "Cart is empty" });
    }

    const accessToken = await getPayPalAccessToken();

    const captureResponse = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok || captureData.status !== "COMPLETED") {
      return res
        .status(400)
        .json({ success: false, msg: "PayPal capture failed" });
    }

    const captureId =
      captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;

    const total = cart.items.reduce(
      (acc, item) => acc + item.game.salePrice * item.quantity,
      0,
    );
    const purchasedGameIds = cart.items.map((item) => item.game._id);

    const newOrder = await Order.create({
      user: req.user.id,
      items: cart.items.map((item) => ({
        game: item.game._id,
        quantity: item.quantity,
      })),
      amount: total,
      paymentId: captureId,
      orderId,
      status: "paid",
      delivered: false,
    });

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { libraryRevokedGames: { $in: purchasedGameIds } },
    });

    cart.items = [];
    await cart.save();

    res.json({ success: true, orderId: newOrder._id, order: newOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "PayPal capture failed" });
  }
};
