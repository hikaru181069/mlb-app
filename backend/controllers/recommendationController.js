const {
  getFutureStarsForUser,
  getRecommendationsForUser,
} = require("../services/recommendations");

const {
  fetchQuizHitters,
  fetchQuizPitchers,
} = require("../services/mlb/quizRecommendationService");

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

// GET /api/recommendations/quiz?type=hitter&style=power&age=young&league=AL
const getQuizRecommendations = async (req, res) => {
  const { type, style, age = "any", league = "both", position = "both" } = req.query;

  try {
    const players = type === "pitcher"
      ? await fetchQuizPitchers({ style, position, age })
      : await fetchQuizHitters({ style, age, league });

    res.json({ type, style, age, league, position, players });
  } catch (error) {
    console.error("Quiz recommendation error:", error.message);
    res.status(500).json({ message: "Failed to fetch quiz recommendations" });
  }
};

module.exports = {
  getFutureStars,
  getRecommendations,
  getQuizRecommendations,
};
