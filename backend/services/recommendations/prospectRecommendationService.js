const FavoritePlayer = require("../../models/FavoritePlayer");
const { fetchProspects }      = require("../mlb/prospectService");
const { fetchFutureStars }    = require("../fastApiService");
const { fetchExternalPlayerStats } = require("../mlb/playerStatsService");
const { formatExternalStats }      = require("../mlb/playerFormatter");

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// お気に入りをFastAPI が期待する形式に変換する
const buildFavPayload = (fav, hitterStats) => ({
  playerId: Number(fav.mlbPlayerId),
  fullName: fav.fullName || "",
  position: fav.position || "",
  stats: {
    ops:         toNumber(hitterStats?.ops),
    homeRuns:    toNumber(hitterStats?.homeRuns),
    stolenBases: toNumber(hitterStats?.stolenBases),
    avg:         toNumber(hitterStats?.battingAverage),
    rbi:         toNumber(hitterStats?.rbis || hitterStats?.rbi),
  },
});

// プロスペクトを FastAPI の YoungPlayerCandidate 形式に変換する
const toCandidate = (p) => ({
  playerId:     p.playerId,
  name:         p.fullName,
  team:         p.parentOrg || p.team,
  position:     p.position,
  age:          p.age,
  ops:          p.ops,
  homeRuns:     p.homeRuns,
  stolenBases:  p.stolenBases,
  avg:          p.avg,
  rbi:          p.rbi,
  oaa:          0,
});

const getProspectsForUser = async (userId) => {
  const [favorites, allProspects] = await Promise.all([
    FavoritePlayer.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3),
    fetchProspects(),
  ]);

  // お気に入りがいなければ上位 OPS プロスペクトを返す
  if (favorites.length === 0) {
    return allProspects.slice(0, 8).map((p) => ({
      ...p,
      similarity:           null,
      similarityPercentage: null,
      reason:               "Top prospect by OPS",
    }));
  }

  // お気に入りヒッターだけに絞る（投手との類似は意味が薄い）
  const hitterFavs = favorites.filter((f) => (f.playerType || "hitter") === "hitter");
  const seedFavs   = hitterFavs.length > 0 ? hitterFavs : favorites.slice(0, 3);

  // 各お気に入りのライブスタッツを並列取得
  const favsWithStats = await Promise.all(
    seedFavs.map(async (fav) => {
      try {
        const raw = await fetchExternalPlayerStats({ playerId: fav.mlbPlayerId });
        const { hitterStats } = formatExternalStats(raw);
        return { fav, hitterStats };
      } catch {
        return { fav, hitterStats: {} };
      }
    }),
  );

  const favPayloads  = favsWithStats.map(({ fav, hitterStats }) =>
    buildFavPayload(fav, hitterStats),
  );
  const candidates   = allProspects.map(toCandidate);

  // FastAPI で類似スコアを計算する
  const futureStars = await fetchFutureStars(favPayloads, candidates, 8);

  if (!futureStars || futureStars.length === 0) {
    return allProspects.slice(0, 8).map((p) => ({
      ...p,
      similarity:           null,
      similarityPercentage: null,
      reason:               "Top prospect by OPS",
    }));
  }

  // FastAPI の結果 + プロスペクト元データをマージする
  const prospectMap = Object.fromEntries(allProspects.map((p) => [p.playerId, p]));
  return futureStars.map((fs) => {
    const base = prospectMap[fs.playerId] || {};
    return {
      ...base,
      playerId:             fs.playerId,
      fullName:             fs.fullName || base.fullName,
      similarity:           fs.similarity,
      similarityPercentage: fs.similarityPercentage,
      reason:               fs.reasons?.[0] || "Similar playstyle",
    };
  });
};

module.exports = { getProspectsForUser };
