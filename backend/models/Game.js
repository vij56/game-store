const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  appId: {
    type: Number,
    required: true,
    min: 10000,
    max: 9999999,
    validate: {
      validator: Number.isInteger,
      message: "appId must be a whole number",
    },
  },
  title: String,
  price: Number,
  salePrice: Number,
  image: String,
  description: String,
  ratings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      value: Number,
    },
  ],
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("Game", gameSchema);
