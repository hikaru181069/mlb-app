const {
  fetchExternalPlayerFullDetails,
  fetchExternalPlayersByTeam,
  fetchExternalPlayers,
} = require("../services/mlbApiService");

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

const getExternalPlayerById = async (req, res) => {
  try {
    const player = await fetchExternalPlayerFullDetails(req.params.playerId);

    res.json(player);
  } catch (error) {
    console.error("External player detail error:", error.message);
    res.status(500).json({ message: "Failed to fetch external player" });
  }
};

const getExternalPlayersByTeam = async (req, res) => {
  try {
    const players = await fetchExternalPlayersByTeam(req.params.teamId);

    res.json(players);
  } catch (error) {
    console.error("External team players error:", error.message);
    res.status(500).json({ message: "Failed to fetch team players" });
  }
};

module.exports = {
  getExternalPlayersByTeam,
  searchExternalPlayers,
  getExternalPlayerById,
};
