const {
  getRecommendationsForUser,
} = require("../services/recommendationService");

const getRecommendations = async (req, res) => {
  try {
    const recommendations = await getRecommendationsForUser(req.user._id);

    res.json(recommendations);
  } catch (error) {
    console.error("Recommendation error:", error.message);
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
};

module.exports = {
  getRecommendations,
};
