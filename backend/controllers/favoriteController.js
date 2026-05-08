const FavoritePlayer = require("../models/FavoritePlayer");

const getFavorites = async (req, res) => {
  try {
    const favorites = await FavoritePlayer.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(favorites);
  } catch (error) {
    console.error("Fetch favorites error:", error.message);
    res.status(500).json({ message: "Failed to fetch favorites" });
  }
};

const createFavorite = async (req, res) => {
  try {
    const favorite = await FavoritePlayer.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json(favorite);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This player is already in your favorites",
      });
    }

    console.error("Create favorite error:", error.message);
    res.status(400).json({
      message: "Failed to create favorite",
      error: error.message,
    });
  }
};

const updateFavorite = async (req, res) => {
  try {
    const favorite = await FavoritePlayer.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.json(favorite);
  } catch (error) {
    console.error("Update favorite error:", error.message);
    res.status(400).json({
      message: "Failed to update favorite",
      error: error.message,
    });
  }
};

const deleteFavorite = async (req, res) => {
  try {
    const favorite = await FavoritePlayer.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.json({ message: "Favorite deleted" });
  } catch (error) {
    console.error("Delete favorite error:", error.message);
    res.status(500).json({ message: "Failed to delete favorite" });
  }
};

module.exports = {
  getFavorites,
  createFavorite,
  updateFavorite,
  deleteFavorite,
};
