const {
  fetchExternalPlayerFullDetails,
  fetchExternalPlayersByTeam,
  fetchRecommendedPlayersByTeam,
  fetchExternalPlayers,
} = require("../services/mlb");

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

const getRecommendedPlayersByTeam = async (req, res) => {
  try {
    const players = await fetchRecommendedPlayersByTeam(req.params.teamId, {
      limit: 12,
      hitterLimit: 8,
      pitcherLimit: 4,
    });

    res.json(players);
  } catch (error) {
    console.error("Recommended team players error:", error.message);
    res.status(500).json({ message: "Failed to fetch recommended players" });
  }
};

module.exports = {
  getExternalPlayersByTeam,
  getRecommendedPlayersByTeam,
  searchExternalPlayers,
  getExternalPlayerById,
};
