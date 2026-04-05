const Order = require("../models/Order");
const User = require("../models/User");
const crypto = require("crypto");

const getInvoiceSecret = () =>
  process.env.INVOICE_SIGN_SECRET || process.env.JWT_SECRET || "invoice-secret";

const signInvoiceOrderId = (orderId) =>
  crypto
    .createHmac("sha256", getInvoiceSecret())
    .update(String(orderId))
    .digest("hex");

const buildPublicInvoiceUrl = (req, orderId) => {
  const signature = signInvoiceOrderId(orderId);
  const frontendBase = process.env.FRONTEND_URL || "";
  const fallbackBase = `${req.protocol}://${req.get("host")}`;
  const base = frontendBase || fallbackBase;

  return {
    signature,
    url: `${base.replace(/\/$/, "")}/invoice/${orderId}/${signature}`,
  };
};

const buildOwnedGamesFromOrders = (orders, req, revokedGameIds = new Set()) => {
  const ownedGamesMap = new Map();

  orders.forEach((order) => {
    const { signature, url } = buildPublicInvoiceUrl(req, order._id);

    order.items.forEach((item) => {
      if (!item.game) return;

      const gameId = item.game._id.toString();
      if (revokedGameIds.has(gameId)) return;

      const existing = ownedGamesMap.get(gameId);
      const quantity = Number(item.quantity) || 1;

      if (existing) {
        existing.purchaseCount += quantity;
        if (
          !existing.latestInvoice?.createdAt ||
          new Date(order.createdAt) > new Date(existing.latestInvoice.createdAt)
        ) {
          existing.latestInvoice = {
            orderId: order._id,
            signature,
            invoiceUrl: url,
            createdAt: order.createdAt,
          };
        }
        return;
      }

      ownedGamesMap.set(gameId, {
        ...item.game.toObject(),
        purchaseCount: quantity,
        latestInvoice: {
          orderId: order._id,
          signature,
          invoiceUrl: url,
          createdAt: order.createdAt,
        },
      });
    });
  });

  return Array.from(ownedGamesMap.values());
};

// GET ORDERS (LIBRARY)
exports.getOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate("items.game");
  res.json(orders);
};

// 🔥 NEW: GET OWNED GAMES
exports.getOwnedGames = async (req, res) => {
  const [orders, user] = await Promise.all([
    Order.find({ user: req.user.id }).populate("items.game"),
    User.findById(req.user.id).select("libraryRevokedGames"),
  ]);

  const revokedGameIds = new Set(
    (user?.libraryRevokedGames || []).map((gameId) => gameId.toString()),
  );

  res.json(buildOwnedGamesFromOrders(orders, req, revokedGameIds));
};

exports.getLatestInvoiceLink = async (req, res) => {
  const latestOrder = await Order.findOne({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("items.game");

  if (!latestOrder) {
    return res.status(404).json({ msg: "No orders found" });
  }

  const { signature, url } = buildPublicInvoiceUrl(req, latestOrder._id);

  res.json({
    order: latestOrder,
    signature,
    invoiceUrl: url,
  });
};

exports.getPublicInvoiceOrder = async (req, res) => {
  const { orderId } = req.params;
  const signature = req.query.sig || "";

  const expectedSignature = signInvoiceOrderId(orderId);
  if (signature !== expectedSignature) {
    return res.status(403).json({ msg: "Invalid invoice link" });
  }

  const order = await Order.findById(orderId).populate("items.game");
  if (!order) {
    return res.status(404).json({ msg: "Invoice not found" });
  }

  res.json({ order });
};
