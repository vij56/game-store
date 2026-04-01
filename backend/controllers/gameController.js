const Game = require("../models/Game");
const Review = require("../models/Review");
const Order = require("../models/Order");

// GET ALL GAMES
exports.getGames = async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching games" });
  }
};

// GET SINGLE GAME
exports.getGame = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ msg: "Invalid ID" });
    }

    const game = await Game.findById(req.params.id).populate({
      path: "reviews.user",
      select: "email username",
    });

    if (!game) {
      return res.status(404).json({ msg: "Game not found" });
    }

    res.json(game);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching game" });
  }
};

// ⭐ RATE GAME
exports.rateGame = async (req, res) => {
  try {
    const { gameId, rating } = req.body;
    const userId = req.user.id;

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({ msg: "Game not found" });
    }

    const existing = game.ratings.find((r) => r.user.toString() === userId);

    if (existing) {
      existing.value = rating;
    } else {
      game.ratings.push({ user: userId, value: rating });
    }

    await game.save();

    res.json({ msg: "Rating submitted" });
  } catch (err) {
    res.status(500).json({ msg: "Error rating game" });
  }
};

// ✍️ ADD REVIEW (FIXED)
exports.addReview = async (req, res) => {
  try {
    const { gameId, comment, rating } = req.body;
    const userId = req.user.id;

    // 1️⃣ Get all user orders
    const orders = await Order.find({ userId });

    // 2️⃣ Check if user purchased this game
    let hasPurchased = false;

    for (let order of orders) {
      if (!order.items || !Array.isArray(order.items)) continue;

      const found = order.items.find(
        (item) => String(item.gameId) === String(gameId),
      );

      if (found) {
        hasPurchased = true;
        break;
      }
    }

    if (!hasPurchased) {
      return res.status(403).json({
        msg: "You can only review games you purchased",
      });
    }

    // 3️⃣ Prevent duplicate review
    const existingReview = await Review.findOne({
      userId,
      gameId,
    });

    if (existingReview) {
      return res.status(400).json({
        msg: "You already reviewed this game",
      });
    }

    // 4️⃣ Create review
    const review = await Review.create({
      userId,
      gameId,
      comment,
      rating,
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId, comment, rating } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    if (String(review.userId) !== String(userId)) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    review.comment = comment;
    review.rating = rating;

    await review.save();

    res.json(review);
  } catch (err) {
    res.status(500).json({ msg: "Error updating review" });
  }
};

// ❌ DELETE REVIEW
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    // Allow owner OR admin
    if (String(review.userId) !== String(userId) && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    await review.deleteOne();

    res.json({ msg: "Review deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting review" });
  }
};
