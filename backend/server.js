const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Player = require("./models/Player");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend server is running");
});

app.get("/api/players", async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch players" });
  }
});

app.get("/api/players/search", async (req, res) => {
  try {
    const searchText = req.query.q || "";
    // models/Player.jsより
    const players = await Player.find({
      name: { $regex: searchText, $options: "i" },
    });
    res.json(players);
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({ message: "Failed to search players" });
  }
});

app.get("/api/players/:id", async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
