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

module.exports = { fetchLeagueStats };
