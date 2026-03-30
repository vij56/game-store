const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  items: Array,
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
});

module.exports = mongoose.model("Order", orderSchema);
