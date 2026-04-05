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

    const persistedReviews = await Review.find({ gameId: game._id })
      .populate("userId", "email username")
      .sort({ createdAt: -1 });

    const normalizedPersistedReviews = persistedReviews.map((review) => ({
      _id: review._id,
      user: review.username
        ? { username: review.username }
        : review.userId
          ? {
              _id: review.userId._id,
              username: review.userId.username,
              email: review.userId.email,
            }
          : null,
      comment: review.comment,
      rating: review.rating,
      createdAt: review.createdAt,
    }));

    const normalizedLegacyReviews = (game.reviews || []).map(
      (review, index) => ({
        _id: `legacy-${index}`,
        user: review.user,
        comment: review.comment,
        rating: review.rating,
        createdAt: review.createdAt,
      }),
    );

    const gameData = game.toObject();
    gameData.reviews = [
      ...normalizedPersistedReviews,
      ...normalizedLegacyReviews,
    ];

    res.json(gameData);
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
    const orders = await Order.find({ user: userId });

    // 2️⃣ Check if user purchased this game
    let hasPurchased = false;

    for (let order of orders) {
      if (!order.items || !Array.isArray(order.items)) continue;

      const found = order.items.find(
        (item) => String(item.game) === String(gameId),
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

    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can delete reviews" });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    await review.deleteOne();

    res.json({ msg: "Review deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting review" });
  }
};
