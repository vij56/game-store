const Order = require("../models/Order");

// GET ORDERS (LIBRARY)
exports.getOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate("items.game");
  res.json(orders);
};

// 🔥 NEW: GET OWNED GAMES
exports.getOwnedGames = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate("items.game");

  const ownedGames = [
    ...new Set(
      orders.flatMap((order) =>
        order.items.map((item) => item.game._id.toString()),
      ),
    ),
  ];

  res.json(ownedGames);
};

exports.getLatestOrder = async (req, res) => {
  const order = await Order.findOne({
    user: req.user.id,
    delivered: false,
  })
    .sort({ createdAt: -1 })
    .populate("items.game");

  if (!order) {
    return res.status(404).json({ msg: "No new order" });
  }

  res.json(order);
};

exports.markDelivered = async (req, res) => {
  const { orderId } = req.body;

  await Order.findByIdAndUpdate(orderId, {
    delivered: true,
  });

  res.json({ msg: "Delivered" });
};
