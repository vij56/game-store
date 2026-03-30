const express = require("express");
const router = express.Router();
const {
  getGames,
  getGame,
  rateGame,
  addReview,
  deleteReview,
} = require("../controllers/gameController");
const auth = require("../middleware/auth");

router.get("/", getGames);
router.get("/:id", getGame);
router.post("/rate", auth, rateGame);
router.post("/review", auth, addReview);
router.post("/review/delete", auth, deleteReview);

module.exports = router;
