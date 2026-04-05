const Game = require("../models/Game");
const Review = require("../models/Review");
const User = require("../models/User");
const Order = require("../models/Order");

function buildGamePayload(body = {}) {
  const price = Number(body.price);
  const appId = Number(body.appId);
  const discountPercent = Number(body.discountPercent || 0);

  const normalizedPayload = {
    ...body,
    appId: Number.isInteger(appId) ? appId : undefined,
    price: Number.isFinite(price) ? price : 0,
  };

  if (Number.isFinite(discountPercent) && discountPercent > 0) {
    const clampedPercent = Math.min(Math.max(discountPercent, 0), 100);
    normalizedPayload.salePrice = Math.max(
      0,
      Math.round(price - (price * clampedPercent) / 100),
    );
  } else {
    normalizedPayload.salePrice = Number.isFinite(Number(body.salePrice))
      ? Number(body.salePrice)
      : normalizedPayload.price;
  }

  return normalizedPayload;
}

async function buildOwnedGamesForUser(userId, revokedGameIds = new Set()) {
  const orders = await Order.find({ user: userId })
    .populate("items.game")
    .sort({ createdAt: -1 });

  const ownedGamesMap = new Map();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!item.game) return;

      const gameId = item.game._id.toString();
      if (revokedGameIds.has(gameId)) return;

      const existing = ownedGamesMap.get(gameId);
      const quantity = Number(item.quantity) || 1;

      if (existing) {
        existing.purchaseCount += quantity;
        if (new Date(order.createdAt) > new Date(existing.lastPurchasedAt)) {
          existing.lastPurchasedAt = order.createdAt;
        }
        return;
      }

      ownedGamesMap.set(gameId, {
        ...item.game.toObject(),
        purchaseCount: quantity,
        lastPurchasedAt: order.createdAt,
      });
    });
  });

  return Array.from(ownedGamesMap.values()).sort(
    (left, right) =>
      new Date(right.lastPurchasedAt).getTime() -
      new Date(left.lastPurchasedAt).getTime(),
  );
}

// CREATE
const addGame = async (req, res) => {
  try {
    const game = new Game(buildGamePayload(req.body));
    await game.save();
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ msg: "Error adding game" });
  }
};

// UPDATE
const updateGame = async (req, res) => {
  try {
    const payload = buildGamePayload(req.body);
    const game = await Game.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    });

    if (!game) return res.status(404).json({ msg: "Game not found" });

    res.json(game);
  } catch (err) {
    res.status(500).json({ msg: "Error updating game" });
  }
};

// DELETE
const deleteGame = async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);

    if (!game) return res.status(404).json({ msg: "Game not found" });

    res.json({ msg: "Game deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting game" });
  }
};

// READ (ADMIN ONLY)
const getAllGamesAdmin = async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching games" });
  }
};

const getLibraryUsers = async (req, res) => {
  try {
    const users = await User.find(
      { role: { $ne: "admin" } },
      "username email",
    ).sort({ username: 1, email: 1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching users" });
  }
};

const getUserLibrary = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "username email role libraryRevokedGames",
    );

    if (!user || user.role === "admin") {
      return res.status(404).json({ msg: "User not found" });
    }

    const revokedGameIds = new Set(
      (user.libraryRevokedGames || []).map((gameId) => gameId.toString()),
    );
    const games = await buildOwnedGamesForUser(user._id, revokedGameIds);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      games,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching user library" });
  }
};

const removeGameFromUserLibrary = async (req, res) => {
  try {
    const { userId, gameId } = req.params;

    const [user, game] = await Promise.all([
      User.findById(userId),
      Game.findById(gameId).select("title"),
    ]);

    if (!user || user.role === "admin") {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!game) {
      return res.status(404).json({ msg: "Game not found" });
    }

    const revokedGameIds = new Set(
      (user.libraryRevokedGames || []).map((id) => id.toString()),
    );

    if (revokedGameIds.has(gameId)) {
      return res.status(409).json({ msg: "Game already removed from library" });
    }

    const currentLibrary = await buildOwnedGamesForUser(userId, revokedGameIds);
    const hasGame = currentLibrary.some(
      (libraryGame) => libraryGame._id.toString() === gameId,
    );

    if (!hasGame) {
      return res
        .status(404)
        .json({ msg: "Game is not in this user's library" });
    }

    user.libraryRevokedGames = [...(user.libraryRevokedGames || []), game._id];
    await user.save();

    res.json({ msg: `${game.title} removed from ${user.username}'s library` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error removing game from library" });
  }
};

module.exports = {
  addGame,
  updateGame,
  deleteGame,
  getAllGamesAdmin,
  getLibraryUsers,
  getUserLibrary,
  removeGameFromUserLibrary,
  addAdminReview,
  updateAdminReview,
  getAdminGameReviews,
  deleteAdminReview,
};

// ── ADMIN-CREATED REVIEW ─────────────────────────────────────────────────────

async function addAdminReview(req, res) {
  try {
    const { gameId, username, comment, rating } = req.body;

    if (!gameId || !username?.trim() || !comment?.trim() || !rating) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ msg: "Game not found" });

    const review = await Review.create({
      gameId,
      username: username.trim(),
      comment: comment.trim(),
      rating: Number(rating),
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
}

async function getAdminGameReviews(req, res) {
  try {
    const reviews = await Review.find({ gameId: req.params.gameId })
      .populate("userId", "username email")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
}

async function updateAdminReview(req, res) {
  try {
    const { comment, rating } = req.body;

    if (!comment?.trim() || !rating) {
      return res.status(400).json({ msg: "Comment and rating are required" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ msg: "Review not found" });

    review.comment = comment.trim();
    review.rating = Number(rating);

    await review.save();
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
}

async function deleteAdminReview(req, res) {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ msg: "Review not found" });
    res.json({ msg: "Review deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
}
