const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
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
