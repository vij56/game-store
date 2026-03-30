const Game = require("../models/Game");
const Order = require("../models/Order");

// GET ALL GAMES
exports.getGames = async (req, res) => {
  const games = await Game.find();
  res.json(games);
};

// GET SINGLE GAME
exports.getGame = async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ msg: "Invalid ID" });
  }

  const game = await Game.findById(req.params.id).populate({
    path: "reviews.user",
    select: "email username",
  }); // 👈 IMPORTANT

  if (!game) return res.status(404).json({ msg: "Game not found" });

  res.json(game);
};

exports.rateGame = async (req, res) => {
  const { gameId, rating } = req.body;
  const userId = req.user.id;

  const game = await Game.findById(gameId);

  if (!game) {
    return res.status(404).json({ msg: "Game not found" });
  }

  // check if already rated
  const existing = game.ratings.find((r) => r.user.toString() === userId);

  if (existing) {
    existing.value = rating; // update rating
  } else {
    game.ratings.push({ user: userId, value: rating });
  }

  await game.save();

  res.json({ msg: "Rating submitted" });
};

exports.addReview = async (req, res) => {
  const { gameId, comment } = req.body;
  const userId = req.user.id;

  const game = await Game.findById(gameId);

  if (!game) {
    return res.status(404).json({ msg: "Game not found" });
  }

  // ✅ CHECK IF USER OWNS THIS GAME
  const orders = await Order.find({ user: userId });

  const ownedGames = orders.flatMap((order) =>
    order.items.map((item) => item.game.toString()),
  );

  if (!ownedGames.includes(gameId)) {
    return res.status(403).json({
      msg: "You can only review games you have purchased",
    });
  }

  // ✅ EXISTING LOGIC
  const existing = game.reviews.find((r) => r.user.toString() === userId);

  if (existing) {
    existing.comment = comment;
  } else {
    game.reviews.push({ user: userId, comment });
  }

  await game.save();

  res.json({ msg: "Review saved" });
};

exports.deleteReview = async (req, res) => {
  const { gameId } = req.body;
  const userId = req.user.id;

  const game = await Game.findById(gameId);

  game.reviews = game.reviews.filter((r) => r.user.toString() !== userId);

  await game.save();

  res.json({ msg: "Review deleted" });
};
