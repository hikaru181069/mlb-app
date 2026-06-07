const {
  getFutureStarsForUser,
  getRecommendationsForUser,
} = require("../services/recommendations");

const getRecommendations = async (req, res) => {
  try {
    const recommendations = await getRecommendationsForUser(req.user._id);

    res.json(recommendations);
  } catch (error) {
    console.error("Recommendation error:", error.message);
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
};

const getFutureStars = async (req, res) => {
  try {
    const futureStars = await getFutureStarsForUser(req.user._id);

    res.json({ futureStars });
  } catch (error) {
    console.error("Future stars recommendation error:", error.message);
    res.status(500).json({
      message: "Failed to fetch future stars recommendations",
    });
  }
};

module.exports = {
  getFutureStars,
  getRecommendations,
};
