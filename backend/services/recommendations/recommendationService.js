const FavoritePlayer = require("../../models/FavoritePlayer");
const { fetchLeagueStats, fetchYoungLeaguePlayers } = require("../mlb/leagueStatsService");
const { fetchDiscoverSimilar, fetchFutureStars } = require("../fastApiService");
const { fetchExternalPlayerStats } = require("../mlb/playerStatsService");
const { formatExternalStats } = require("../mlb/playerFormatter");
const { getOaaMap } = require("../mlb/baseballSavantService");
const { fallbackPlayers } = require("./fallbackPlayers");

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// ── getRecommendationsForUser ─────────────────────────────────────────────────
// お気に入り選手のライブスタッツを取得し、FastAPI /discover/similar で
// 類似選手を計算して返す。お気に入りがない場合は人気選手をフォールバックにする。

const buildTarget = (fav, hitterStats, pitcherStats) => {
  const oaaMap = getOaaMap();
  return {
    playerId:    Number(fav.mlbPlayerId),
    playerType:  fav.playerType || "hitter",
    position:    fav.position   || "",
    ops:         toNumber(hitterStats?.ops),
    homeRuns:    toNumber(hitterStats?.homeRuns),
    stolenBases: toNumber(hitterStats?.stolenBases),
    avg:         toNumber(hitterStats?.battingAverage),
    rbi:         toNumber(hitterStats?.rbis || hitterStats?.rbi),
    oaa:         oaaMap[Number(fav.mlbPlayerId)] ?? 0,
    era:         toNumber(pitcherStats?.era),
    whip:        toNumber(pitcherStats?.whip),
    strikeouts:  toNumber(pitcherStats?.strikeouts),
    walks:       toNumber(pitcherStats?.baseOnBalls),
    wins:        toNumber(pitcherStats?.wins),
    innings:     toNumber(pitcherStats?.inningsPitched),
  };
};

const toHitterCandidate = (p) => ({
  playerId:    p.playerId,
  name:        p.name,
  team:        p.team,
  position:    p.position    || "",
  age:         p.age         || 0,
  ops:         p.ops,
  homeRuns:    p.homeRuns,
  stolenBases: p.stolenBases,
  avg:         p.avg,
  rbi:         p.rbi,
  oaa:         p.oaa         ?? 0,
});

const toPitcherCandidate = (p) => ({
  playerId:   p.playerId,
  name:       p.name,
  team:       p.team,
  position:   p.position || "",
  age:        0,
  era:        p.era,
  whip:       p.whip,
  strikeouts: p.strikeouts,
  walks:      0,
  wins:       p.wins,
  innings:    p.innings,
});

const getRecommendationsForUser = async (userId) => {
  const favorites = await FavoritePlayer.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(3);

  const favoriteIds = new Set(favorites.map((f) => Number(f.mlbPlayerId)));

  if (favorites.length === 0) {
    return fallbackPlayers.slice(0, 5).map((p) => ({
      mlbPlayerId: p.playerId,
      name:        p.fullName,
      team:        p.team || "",
      reason:      "Popular MLB player",
    }));
  }

  const leagueStats = await fetchLeagueStats();

  // 各お気に入り選手のライブスタッツを並行取得
  const favWithStats = await Promise.all(
    favorites.map(async (fav) => {
      try {
        const raw = await fetchExternalPlayerStats({ playerId: fav.mlbPlayerId });
        const { hitterStats, pitcherStats } = formatExternalStats(raw);
        return { fav, hitterStats, pitcherStats };
      } catch {
        return { fav, hitterStats: {}, pitcherStats: {} };
      }
    }),
  );

  const recommendations = [];
  const recommendedIds  = new Set(favoriteIds);

  for (const { fav, hitterStats, pitcherStats } of favWithStats) {
    const isPitcher     = fav.playerType === "pitcher";
    const target        = buildTarget(fav, hitterStats, pitcherStats);
    const pool          = isPitcher ? leagueStats.pitcher.players : leagueStats.hitter.players;
    const mlbCandidates = pool
      .filter((p) => !recommendedIds.has(Number(p.playerId)))
      .map(isPitcher ? toPitcherCandidate : toHitterCandidate);

    try {
      const result = await fetchDiscoverSimilar(target, mlbCandidates, [], 2);
      for (const match of result?.mlbSimilar ?? []) {
        if (!recommendedIds.has(Number(match.playerId))) {
          recommendations.push({
            mlbPlayerId:          match.playerId,
            name:                 match.name,
            team:                 match.team,
            reason:               `Similar playstyle to ${fav.fullName}`,
            similarityPercentage: match.similarityPercentage,
          });
          recommendedIds.add(Number(match.playerId));
        }
      }
    } catch (err) {
      console.warn(`[recommendations] discover/similar failed for ${fav.fullName}: ${err.message}`);
    }

    if (recommendations.length >= 5) break;
  }

  // 不足分をフォールバック（人気選手）で補う
  for (const p of fallbackPlayers) {
    if (recommendations.length >= 5) break;
    const id = Number(p.playerId);
    if (!recommendedIds.has(id)) {
      recommendations.push({
        mlbPlayerId: id,
        name:        p.fullName,
        team:        p.team || "",
        reason:      "Popular MLB player",
      });
      recommendedIds.add(id);
    }
  }

  return recommendations.slice(0, 5);
};

// ── getFutureStarsForUser ──────────────────────────────────────────────────────

const pickHitterStats = (favorite) =>
  favorite.currentSeasonStats?.hitterStats ||
  favorite.hitterStats ||
  favorite.careerStats?.hitterStats ||
  {};

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

const getFutureStarsForUser = async (userId) => {
  const favorites = await FavoritePlayer.find({ user: userId }).sort({ createdAt: -1 });

  if (favorites.length === 0) return [];

  const favoritePlayers = favorites.map(toFutureStarFavorite).filter((p) => p.playerId);

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
