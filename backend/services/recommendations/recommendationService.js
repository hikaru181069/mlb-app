const FavoritePlayer = require("../../models/FavoritePlayer");
const User = require("../../models/User");
const {
  fetchExternalPlayers,
  fetchRecommendedPlayersByTeam,
} = require("../mlb");
const { fallbackPlayers } = require("./fallbackPlayers");
const { addUniqueRecommendations } = require("./recommendationUtils");

const getRecommendationsForUser = async (userId) => {
  const user = await User.findById(userId).select("-password");
  const favorites = await FavoritePlayer.find({ user: userId });
  const favoriteIds = new Set(
    favorites.map((favorite) => Number(favorite.mlbPlayerId)),
  );
  const recommendations = [];

  if (user?.favoriteTeam?.id) {
    try {
      const teamPlayers = await fetchRecommendedPlayersByTeam(
        user.favoriteTeam.id,
        {
          limit: 3,
          hitterLimit: 2,
          pitcherLimit: 1,
          excludePlayerIds: [...favoriteIds],
        },
      );

      addUniqueRecommendations({
        candidates: teamPlayers,
        existingIds: favoriteIds,
        recommendations,
        reason: `Your favorite team is the ${user.favoriteTeam.name}.`,
      });
    } catch (error) {
      console.error("Team recommendation error:", error.message);
    }
  }

  if (recommendations.length < 3 && favorites.length > 0) {
    try {
      const favoritePosition = favorites[0].position;
      const searchPlayers = await fetchExternalPlayers(favoritePosition);

      addUniqueRecommendations({
        candidates: searchPlayers,
        existingIds: favoriteIds,
        recommendations,
        reason: `You saved a ${favoritePosition}, so this player may fit your taste.`,
      });
    } catch (error) {
      console.error("Position recommendation error:", error.message);
    }
  }

  if (recommendations.length < 3) {
    addUniqueRecommendations({
      candidates: fallbackPlayers,
      existingIds: favoriteIds,
      recommendations,
      reason: "Fallback recommendation while we learn your preferences.",
    });
  }

  return recommendations.slice(0, 3);
};

module.exports = {
  getRecommendationsForUser,
};
