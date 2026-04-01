const Game = require("../models/Game");

// CREATE
const addGame = async (req, res) => {
  try {
    const game = new Game(req.body);
    await game.save();
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ msg: "Error adding game" });
  }
};

// UPDATE
const updateGame = async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, {
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

module.exports = {
  addGame,
  updateGame,
  deleteGame,
  getAllGamesAdmin,
};
