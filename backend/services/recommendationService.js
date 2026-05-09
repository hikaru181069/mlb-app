const FavoritePlayer = require("../models/FavoritePlayer");
const User = require("../models/User");
const {
  fetchExternalPlayers,
  fetchRecommendedPlayersByTeam,
} = require("./mlbApiService");

const fallbackPlayers = [
  {
    playerId: 660271,
    fullName: "Shohei Ohtani",
    team: "Los Angeles Dodgers",
    position: "Designated Hitter",
    reason: "A popular fallback recommendation while we learn your taste.",
  },
  {
    playerId: 605141,
    fullName: "Mookie Betts",
    team: "Los Angeles Dodgers",
    position: "Shortstop",
    reason: "A popular fallback recommendation while we learn your taste.",
  },
  {
    playerId: 592450,
    fullName: "Aaron Judge",
    team: "New York Yankees",
    position: "Outfielder",
    reason: "A popular fallback recommendation while we learn your taste.",
  },
];

const formatRecommendation = (player, reason) => {
  return {
    playerId: player.externalId || player.mlbPlayerId || player.playerId,
    fullName: player.name || player.fullName,
    team: player.team || player.teamName || "Unknown",
    position: player.position || "Unknown",
    image: player.image || player.imageUrl || "",
    playerType: player.playerType || "hitter",
    hitterStats: player.hitterStats,
    pitcherStats: player.pitcherStats,
    currentSeasonStats: player.currentSeasonStats,
    active: player.active,
    recommendationScore: player.recommendationScore,
    recommendationReasons: player.recommendationReasons,
    source: "Recommendation",
    reason,
  };
};

const addUniqueRecommendations = ({
  candidates,
  existingIds,
  recommendations,
  reason,
}) => {
  for (const candidate of candidates) {
    const playerId =
      candidate.externalId || candidate.mlbPlayerId || candidate.playerId;

    if (!playerId || existingIds.has(Number(playerId))) {
      continue;
    }

    const alreadyRecommended = recommendations.some(
      (player) => Number(player.playerId) === Number(playerId),
    );

    if (alreadyRecommended) {
      continue;
    }

    recommendations.push(formatRecommendation(candidate, reason));

    if (recommendations.length >= 3) {
      break;
    }
  }
};

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
