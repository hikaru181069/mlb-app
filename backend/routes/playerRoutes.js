const express = require("express");
const Player = require("../models/Player");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch players" });
  }
});

router.post("/", async (req, res) => {
  try {
    const player = await Player.create(req.body);
    res.status(201).json(player);
  } catch (error) {
    console.error("Create player error:", error.message);
    res.status(500).json({ message: "Failed to create player" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const searchText = req.query.q || "";

    const players = await Player.find({
      $or: [
        { name: { $regex: searchText, $options: "i" } },
        { team: { $regex: searchText, $options: "i" } },
        { position: { $regex: searchText, $options: "i" } },
      ],
    });

    res.json(players);
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({ message: "Failed to search players" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json(player);
  } catch (error) {
    console.error("Player detail error:", error.message);
    res.status(500).json({ message: "Failed to fetch player" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json(player);
  } catch (error) {
    console.error("Update player error:", error.message);
    res.status(500).json({ message: "Failed to update player" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json({ message: "Player deleted" });
  } catch (error) {
    console.error("Delete player error:", error.message);
    res.status(500).json({ message: "Failed to delete player" });
  }
});

module.exports = router;
