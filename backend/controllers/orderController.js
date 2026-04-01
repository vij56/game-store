const Order = require("../models/Order");

// GET ORDERS (LIBRARY)
exports.getOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate("items.game");
  res.json(orders);
};

// 🔥 NEW: GET OWNED GAMES
exports.getOwnedGames = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate("items.game");

  const ownedGames = [];

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.game) {
        ownedGames.push(item.game);
      }
    });
  });

  // remove duplicates
  const uniqueGames = Array.from(
    new Map(ownedGames.map((g) => [g._id.toString(), g])).values(),
  );

  res.json(uniqueGames);
};
