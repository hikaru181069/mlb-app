const {
  fetchHittingLeaders,
  fetchPitchingLeaders,
} = require("../services/mlb/leaderboardService");

const {
  fetchHotHitters,
  fetchHotPitchers,
} = require("../services/mlb/hotPlayersService");

const getLeaders = async (req, res) => {
  const type = req.query.type === "pitching" ? "pitching" : "hitting";
  const limit = Math.min(Number(req.query.limit) || 10, 20);

  try {
    const data =
      type === "pitching"
        ? await fetchPitchingLeaders(limit)
        : await fetchHittingLeaders(limit);

    res.json({ type, season: new Date().getFullYear(), categories: data });
  } catch (error) {
    console.error("Stats leaders error:", error.message);
    res.status(500).json({ message: "Failed to fetch stats leaders" });
  }
};

// GET /api/stats/hot?days=14
const getHotPlayers = async (req, res) => {
  const days = Math.min(Number(req.query.days) || 14, 30);

  try {
    const [hitters, pitchers] = await Promise.all([
      fetchHotHitters({ days }),
      fetchHotPitchers({ days }),
    ]);

    res.json({ days, hitters, pitchers });
  } catch (error) {
    console.error("Hot players error:", error.message);
    res.status(500).json({ message: "Failed to fetch hot players" });
  }
};

module.exports = { getLeaders, getHotPlayers };
