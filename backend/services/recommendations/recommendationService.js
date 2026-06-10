const FavoritePlayer = require("../../models/FavoritePlayer");
const User = require("../../models/User");
const {
  fetchExternalPlayers,
  fetchRecommendedPlayersByTeam,
} = require("../mlb");
const { fetchFutureStars } = require("../fastApiService");
const { fetchYoungLeaguePlayers } = require("../mlb/leagueStatsService");
const { fallbackPlayers } = require("./fallbackPlayers");
const { addUniqueRecommendations } = require("./recommendationUtils");

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const pickHitterStats = (favorite) => {
  return (
    favorite.currentSeasonStats?.hitterStats ||
    favorite.hitterStats ||
    favorite.careerStats?.hitterStats ||
    {}
  );
};

const pickPitcherStats = (favorite) => {
  return (
    favorite.currentSeasonStats?.pitcherStats ||
    favorite.pitcherStats ||
    favorite.careerStats?.pitcherStats ||
    {}
  );
};

const toFutureStarFavorite = (favorite) => {
  const hitterStats = pickHitterStats(favorite);

  return {
    playerId: Number(favorite.mlbPlayerId),
    fullName: favorite.fullName,
    position: favorite.position,
    stats: {
      ops:         toNumber(hitterStats.ops),
      homeRuns:    toNumber(hitterStats.homeRuns),
      stolenBases: toNumber(hitterStats.stolenBases),
      avg:         toNumber(hitterStats.battingAverage || hitterStats.avg),
      rbi:         toNumber(hitterStats.runsBattedIn  || hitterStats.rbi),
    },
  };
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

const getFutureStarsForUser = async (userId) => {
  const favorites = await FavoritePlayer.find({ user: userId }).sort({
    createdAt: -1,
  });

  if (favorites.length === 0) return [];

  const favoritePlayers = favorites
    .map(toFutureStarFavorite)
    .filter((p) => p.playerId);

  // MLB Stats API から25歳以下の若手選手を動的に取得して候補にする
  let candidates = [];
  try {
    candidates = await fetchYoungLeaguePlayers(25);
  } catch (err) {
    console.warn("Young players fetch failed, using empty candidates:", err.message);
  }

  const futureStars = await fetchFutureStars(favoritePlayers, candidates, 5);
  return futureStars || [];
};

module.exports = {
  getFutureStarsForUser,
  getRecommendationsForUser,
};
