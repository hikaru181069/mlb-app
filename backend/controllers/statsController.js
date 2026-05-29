const {
  fetchHittingLeaders,
  fetchPitchingLeaders,
} = require("../services/mlb/leaderboardService");

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

module.exports = { getLeaders };
