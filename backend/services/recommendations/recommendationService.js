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
    .limit(5);

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
// MongoDBの保存スタッツはオンボーディング時に取得されないため0になりやすい。
// getRecommendationsForUserと同様にライブスタッツを取得してFastAPIに渡す。

const getFutureStarsForUser = async (userId) => {
  const favorites = await FavoritePlayer.find({ user: userId }).sort({ createdAt: -1 });

  if (favorites.length === 0) return [];

  const favWithStats = await Promise.all(
    favorites.map(async (fav) => {
      try {
        const raw = await fetchExternalPlayerStats({ playerId: fav.mlbPlayerId });
        const { hitterStats } = formatExternalStats(raw);
        return { fav, hitterStats };
      } catch {
        return { fav, hitterStats: {} };
      }
    }),
  );

  const favoritePlayers = favWithStats
    .map(({ fav, hitterStats }) => ({
      playerId: Number(fav.mlbPlayerId),
      fullName: fav.fullName,
      position: fav.position || "",
      stats: {
        ops:         toNumber(hitterStats.ops),
        homeRuns:    toNumber(hitterStats.homeRuns),
        stolenBases: toNumber(hitterStats.stolenBases),
        avg:         toNumber(hitterStats.battingAverage),
        rbi:         toNumber(hitterStats.rbis || hitterStats.rbi),
      },
    }))
    .filter((p) => p.playerId);

  let candidates = [];
  try {
    candidates = await fetchYoungLeaguePlayers(25);
  } catch (err) {
    console.warn("Young players fetch failed:", err.message);
  }

  const futureStars = await fetchFutureStars(favoritePlayers, candidates, 5);
  return futureStars || [];
};

// ── getGroupedRecommendationsForUser ──────────────────────────────────────────
// お気に入り選手ごとに「なぜ推薦されたか」をグループ化して返す。
// 各グループ: { seedPlayer, matches[] }
// matches には類似選手のキースタッツ（リーグスタッツプールから取得）を含む。

const getGroupedRecommendationsForUser = async (userId) => {
  const favorites = await FavoritePlayer.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5);

  const favoriteIds = new Set(favorites.map((f) => Number(f.mlbPlayerId)));

  if (favorites.length === 0) {
    return {
      hasFavorites: false,
      groups: [],
      fallback: fallbackPlayers.slice(0, 5).map((p) => ({
        mlbPlayerId: p.playerId,
        name:        p.fullName,
        team:        p.team || "",
      })),
    };
  }

  const leagueStats = await fetchLeagueStats();

  // プレイヤーIDからキースタッツを引けるルックアップマップを構築
  const hitterPoolMap = {};
  for (const p of leagueStats.hitter.players) {
    hitterPoolMap[Number(p.playerId)] = {
      ops:         p.ops,
      homeRuns:    p.homeRuns,
      stolenBases: p.stolenBases,
    };
  }
  const pitcherPoolMap = {};
  for (const p of leagueStats.pitcher.players) {
    pitcherPoolMap[Number(p.playerId)] = {
      era:        p.era,
      strikeouts: p.strikeouts,
      wins:       p.wins,
    };
  }

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

  const groups = [];
  const recommendedIds = new Set(favoriteIds);

  for (const { fav, hitterStats, pitcherStats } of favWithStats) {
    const isPitcher    = fav.playerType === "pitcher";
    const target       = buildTarget(fav, hitterStats, pitcherStats);
    const pool         = isPitcher ? leagueStats.pitcher.players : leagueStats.hitter.players;
    const mlbCandidates = pool
      .filter((p) => !recommendedIds.has(Number(p.playerId)))
      .map(isPitcher ? toPitcherCandidate : toHitterCandidate);

    const seedKeyStats = isPitcher
      ? { era: toNumber(pitcherStats?.era), strikeouts: toNumber(pitcherStats?.strikeouts), wins: toNumber(pitcherStats?.wins) }
      : { ops: toNumber(hitterStats?.ops), homeRuns: toNumber(hitterStats?.homeRuns), stolenBases: toNumber(hitterStats?.stolenBases) };

    let rawMatches = [];
    try {
      const result = await fetchDiscoverSimilar(target, mlbCandidates, [], 2);
      for (const match of result?.mlbSimilar ?? []) {
        if (!recommendedIds.has(Number(match.playerId))) {
          rawMatches.push({
            mlbPlayerId:          match.playerId,
            name:                 match.name,
            team:                 match.team,
            position:             match.position,
            age:                  match.age,
            similarityPercentage: match.similarityPercentage,
            playerType:           isPitcher ? "pitcher" : "hitter",
          });
          recommendedIds.add(Number(match.playerId));
        }
      }
    } catch (err) {
      console.warn(`[grouped-rec] discover/similar failed for ${fav.fullName}: ${err.message}`);
    }

    // マッチした選手のライブスタッツを並行取得してスタット比較に使う
    // プールデータはカテゴリごと上位200名のみなので一部の値がゼロになるため
    const matches = await Promise.all(
      rawMatches.map(async (match) => {
        try {
          const raw = await fetchExternalPlayerStats({ playerId: match.mlbPlayerId });
          const { hitterStats, pitcherStats } = formatExternalStats(raw);
          const liveKeyStats = isPitcher
            ? { era: toNumber(pitcherStats?.era), strikeouts: toNumber(pitcherStats?.strikeouts), wins: toNumber(pitcherStats?.wins) }
            : { ops: toNumber(hitterStats?.ops), homeRuns: toNumber(hitterStats?.homeRuns), stolenBases: toNumber(hitterStats?.stolenBases) };
          return { ...match, keyStats: liveKeyStats };
        } catch {
          // ライブ取得失敗時はプールデータにフォールバック
          const fallback = isPitcher
            ? (pitcherPoolMap[Number(match.mlbPlayerId)] || {})
            : (hitterPoolMap[Number(match.mlbPlayerId)] || {});
          return { ...match, keyStats: fallback };
        }
      }),
    );

    if (matches.length > 0) {
      groups.push({
        seedPlayer: {
          mlbPlayerId: Number(fav.mlbPlayerId),
          name:        fav.fullName,
          playerType:  fav.playerType || "hitter",
          keyStats:    seedKeyStats,
        },
        matches,
      });
    }
  }

  return { hasFavorites: true, groups };
};

module.exports = {
  getFutureStarsForUser,
  getRecommendationsForUser,
  getGroupedRecommendationsForUser,
};
