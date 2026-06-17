const FavoritePlayer = require("../../models/FavoritePlayer");
const { fetchProspects }           = require("../mlb/prospectService");
const { fetchFutureStars }         = require("../fastApiService");
const { fetchExternalPlayerStats } = require("../mlb/playerStatsService");
const { formatExternalStats }      = require("../mlb/playerFormatter");

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// お気に入りを FastAPI hitter 形式に変換する
const buildHitterFavPayload = (fav, hitterStats) => ({
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

// 野手プロスペクトを FastAPI YoungPlayerCandidate 形式に変換する
const toHitterCandidate = (p) => ({
  playerId:    p.playerId,
  name:        p.fullName,
  team:        p.parentOrg || p.team,
  position:    p.position,
  age:         p.age,
  ops:         p.ops,
  homeRuns:    p.homeRuns,
  stolenBases: p.stolenBases,
  avg:         p.avg,
  rbi:         p.rbi,
  oaa:         0,
});

// ── 野手プロスペクト推薦 ─────────────────────────────────────────────────

const getHitterProspects = async (favorites, allProspects) => {
  const hitterFavs = favorites.filter((f) => (f.playerType || "hitter") !== "pitcher");

  if (hitterFavs.length === 0) {
    return allProspects.hitters.slice(0, 6).map((p) => ({
      ...p,
      similarityPercentage: null,
      reason: "Top prospect by OPS",
    }));
  }

  const favsWithStats = await Promise.all(
    hitterFavs.slice(0, 3).map(async (fav) => {
      try {
        const raw = await fetchExternalPlayerStats({ playerId: fav.mlbPlayerId });
        const { hitterStats } = formatExternalStats(raw);
        return { fav, hitterStats };
      } catch {
        return { fav, hitterStats: {} };
      }
    }),
  );

  const favPayloads = favsWithStats.map(({ fav, hitterStats }) =>
    buildHitterFavPayload(fav, hitterStats),
  );
  const candidates = allProspects.hitters.map(toHitterCandidate);

  const futureStars = await fetchFutureStars(favPayloads, candidates, 6);

  if (!futureStars || futureStars.length === 0) {
    return allProspects.hitters.slice(0, 6).map((p) => ({
      ...p,
      similarityPercentage: null,
      reason: "Top prospect by OPS",
    }));
  }

  const prospectMap = Object.fromEntries(
    allProspects.hitters.map((p) => [p.playerId, p]),
  );
  return futureStars.map((fs) => {
    const base = prospectMap[fs.playerId] || {};
    return {
      ...base,
      playerId:             fs.playerId,
      fullName:             fs.fullName || base.fullName,
      similarityPercentage: fs.similarityPercentage,
      reason:               fs.reasons?.[0] || "Similar playstyle",
    };
  });
};

// ── 投手プロスペクト推薦（ERA 上位を返す） ────────────────────────────────

const getPitcherProspects = (allProspects) => {
  return allProspects.pitchers.slice(0, 6).map((p) => ({
    ...p,
    similarityPercentage: null,
    reason:               p.era > 0 ? `${p.era.toFixed(2)} ERA` : "Top pitcher prospect",
  }));
};

// ── メイン ────────────────────────────────────────────────────────────────

const getProspectsForUser = async (userId) => {
  const [favorites, allProspects] = await Promise.all([
    FavoritePlayer.find({ user: userId }).sort({ createdAt: -1 }).limit(5),
    fetchProspects(),
  ]);

  const [hitters, pitchers] = await Promise.all([
    getHitterProspects(favorites, allProspects),
    getPitcherProspects(allProspects),
  ]);

  return { hitters, pitchers };
};

module.exports = { getProspectsForUser };
