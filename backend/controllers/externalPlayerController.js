const { fetchExternalPlayers } = require("../services/mlbApiService");

const searchExternalPlayers = async (req, res) => {
  try {
    const searchText = req.query.q || "";

    if (!searchText.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const players = await fetchExternalPlayers(searchText);

    res.json(players);
  } catch (error) {
    console.error("External player search error:", error.message);
    res.status(500).json({ message: "Failed to search external players" });
  }
};

module.exports = { searchExternalPlayers };
