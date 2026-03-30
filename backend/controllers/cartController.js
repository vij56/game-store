const Cart = require("../models/Cart");

// ADD TO CART
exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const { gameId } = req.body;

  if (!gameId) {
    return res.status(400).json({ msg: "Game ID required" });
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.game.toString() === gameId,
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += 1;
  } else {
    cart.items.push({ game: gameId, quantity: 1 });
  }

  await cart.save();
  res.json({ msg: "Added to cart", cart });
};

// GET CART
// GET CART (FIXED)
exports.getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate("items.game");

  if (!cart) return res.json({ items: [] });

  // ✅ REMOVE BROKEN ITEMS (VERY IMPORTANT)
  cart.items = cart.items.filter((item) => item.game !== null);

  await cart.save(); // optional but recommended

  res.json(cart);
};

// REMOVE
exports.removeFromCart = async (req, res) => {
  const { gameId } = req.body;

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) return res.status(404).json({ msg: "Cart not found" });

  cart.items = cart.items.filter((item) => item.game.toString() !== gameId);

  await cart.save();
  res.json(cart);
};

// UPDATE QTY
exports.updateQuantity = async (req, res) => {
  const { gameId, quantity } = req.body;

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) return res.status(404).json({ msg: "Cart not found" });

  const item = cart.items.find((i) => i.game.toString() === gameId);

  if (!item) return res.status(404).json({ msg: "Item not found" });

  item.quantity = quantity;

  await cart.save();
  res.json(cart);
};
