const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [
      {
        game: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Game",
        },
        quantity: Number,
      },
    ],
    amount: Number,
    paymentId: String,
    orderId: String,
    status: {
      type: String,
      default: "paid",
    },
    delivered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
