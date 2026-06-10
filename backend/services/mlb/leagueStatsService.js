const { fetchFromMlbApi } = require("./mlbClient");

const MLB_LEADERS_URL = "https://statsapi.mlb.com/api/v1/stats/leaders";
const CURRENT_SEASON = new Date().getFullYear().toString();

// ── 野手 ──────────────────────────────────────────────────────────────────

// MLB Stats API のリーダーカテゴリとして有効なものだけを使用する
// baseOnBalls / strikeOuts はリーダーカテゴリとして未対応のため除外

const HITTER_CATEGORIES = [
  "onBasePlusSlugging",
  "homeRuns",
  "stolenBases",
  "battingAverage",
  "runsBattedIn",
];

const HITTER_CATEGORY_TO_KEY = {
  onBasePlusSlugging: "ops",
  homeRuns:           "homeRuns",
  stolenBases:        "stolenBases",
  battingAverage:     "avg",
  runsBattedIn:       "rbi",
};

// ── 投手 ──────────────────────────────────────────────────────────────────

const PITCHER_CATEGORIES = [
  "earnedRunAverage",
  "walksAndHitsPerInningPitched",
  "strikeouts",
  "wins",
  "inningsPitched",
];

const PITCHER_CATEGORY_TO_KEY = {
  earnedRunAverage:             "era",
  walksAndHitsPerInningPitched: "whip",
  strikeouts:                   "strikeouts",
  wins:                         "wins",
  inningsPitched:               "innings",
};

// ── キャッシュ ────────────────────────────────────────────────────────────

const CACHE_TTL = 24 * 60 * 60 * 1000;
let cache = null;
let cacheTime = null;

function buildDistributions(keys) {
  return Object.fromEntries(keys.map((k) => [k, []]));
}

async function fetchLeaderGroup({ categories, categoryToKey, statGroup }) {
  const params = new URLSearchParams({
    leaderCategories: categories.join(","),
    season: CURRENT_SEASON,
    statGroup,
    limit: "200",
  });

  const data = await fetchFromMlbApi(
    `${MLB_LEADERS_URL}?${params}`,
    `Failed to fetch ${statGroup} league stats for scouting`,
  );

  const distributions = buildDistributions(Object.values(categoryToKey));
  const playerMap = {};

  for (const cat of data.leagueLeaders || []) {
    const statKey = categoryToKey[cat.leaderCategory];
    if (!statKey) continue;

    for (const leader of cat.leaders || []) {
      const id = leader.person?.id;
      if (!id) continue;

      const value = parseFloat(leader.value) || 0;
      distributions[statKey].push(value);

      if (!playerMap[id]) {
        playerMap[id] = {
          playerId: id,
          name: leader.person?.fullName || "",
          team: leader.team?.name || "",
          ...Object.fromEntries(Object.values(categoryToKey).map((k) => [k, 0])),
        };
      }
      playerMap[id][statKey] = value;
    }
  }

  return { distributions, players: Object.values(playerMap) };
}

// ── 年齢・ポジションのバッチ取得（野手・投手共通ヘルパー） ─────────────────

const fetchPlayerMeta = async (playerIds) => {
  const ageMap = {};
  const positionMap = {};
  const chunks = [];
  for (let i = 0; i < playerIds.length; i += 50) {
    chunks.push(playerIds.slice(i, i + 50));
  }
  await Promise.all(
    chunks.map(async (chunk) => {
      const ids = chunk.join(",");
      try {
        const data = await fetchFromMlbApi(
          `https://statsapi.mlb.com/api/v1/people?personIds=${ids}`,
          "Failed to fetch player meta",
        );
        for (const person of data.people || []) {
          ageMap[person.id] = person.currentAge ?? 99;
          positionMap[person.id] = person.primaryPosition?.abbreviation ?? "";
        }
      } catch { /* バッチ取得失敗は黙って無視 */ }
    }),
  );
  return { ageMap, positionMap };
};

// ── 若手野手キャッシュ ─────────────────────────────────────────────────────

let youngPlayersCache = null;
let youngPlayersCacheTime = null;

const fetchYoungLeaguePlayers = async (maxAge = 26) => {
  if (youngPlayersCache && youngPlayersCacheTime && Date.now() - youngPlayersCacheTime < CACHE_TTL) {
    return youngPlayersCache.filter((p) => p.age <= maxAge);
  }

  const leagueStats = await fetchLeagueStats();
  const players = leagueStats.hitter.players;
  if (!players.length) return [];

  const { ageMap, positionMap } = await fetchPlayerMeta(players.map((p) => p.playerId));

  // 年齢が取得できた選手のみキャッシュに保存（年齢不明は除外）
  youngPlayersCache = players
    .filter((p) => (ageMap[p.playerId] ?? 99) < 99)
    .map((p) => ({
      playerId:    p.playerId,
      name:        p.name,
      team:        p.team,
      position:    positionMap[p.playerId] ?? "",
      age:         ageMap[p.playerId] ?? 0,
      ops:         p.ops,
      homeRuns:    p.homeRuns,
      stolenBases: p.stolenBases,
      avg:         p.avg,
      rbi:         p.rbi,
    }));
  youngPlayersCacheTime = Date.now();
  return youngPlayersCache.filter((p) => p.age <= maxAge);
};

// ── 若手投手キャッシュ ─────────────────────────────────────────────────────

let youngPitchersCache = null;
let youngPitchersCacheTime = null;

const fetchYoungPitchers = async (maxAge = 26) => {
  if (youngPitchersCache && youngPitchersCacheTime && Date.now() - youngPitchersCacheTime < CACHE_TTL) {
    return youngPitchersCache.filter((p) => p.age <= maxAge);
  }

  const leagueStats = await fetchLeagueStats();
  const players = leagueStats.pitcher.players;
  if (!players.length) return [];

  const { ageMap, positionMap } = await fetchPlayerMeta(players.map((p) => p.playerId));

  youngPitchersCache = players
    .filter((p) => (ageMap[p.playerId] ?? 99) < 99)
    .map((p) => ({
      playerId:   p.playerId,
      name:       p.name,
      team:       p.team,
      position:   positionMap[p.playerId] ?? "",
      age:        ageMap[p.playerId] ?? 0,
      era:        p.era,
      whip:       p.whip,
      strikeouts: p.strikeouts,
      walks:      0,
      wins:       p.wins,
      innings:    p.innings,
    }));
  youngPitchersCacheTime = Date.now();
  return youngPitchersCache.filter((p) => p.age <= maxAge);
};

const fetchLeagueStats = async () => {
  if (cache && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
    return cache;
  }

  const [hitter, pitcher] = await Promise.all([
    fetchLeaderGroup({
      categories: HITTER_CATEGORIES,
      categoryToKey: HITTER_CATEGORY_TO_KEY,
      statGroup: "hitting",
    }),
    fetchLeaderGroup({
      categories: PITCHER_CATEGORIES,
      categoryToKey: PITCHER_CATEGORY_TO_KEY,
      statGroup: "pitching",
    }),
  ]);

  cache = { hitter, pitcher };
  cacheTime = Date.now();

  return cache;
};

module.exports = { fetchLeagueStats, fetchYoungLeaguePlayers, fetchYoungPitchers };
