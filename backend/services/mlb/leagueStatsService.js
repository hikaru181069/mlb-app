const { fetchFromMlbApi } = require("./mlbClient");
const { getOaaMap }       = require("./baseballSavantService");

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
  const oaaMap = getOaaMap();
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
      oaa:         oaaMap[p.playerId] ?? 0,
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

  // OAA（守備指標）をローカル CSV から野手データにマージする
  const oaaMap = getOaaMap();
  const hitterWithOaa = {
    ...hitter,
    players: hitter.players.map((p) => ({ ...p, oaa: oaaMap[p.playerId] ?? 0 })),
  };

  cache = { hitter: hitterWithOaa, pitcher };
  cacheTime = Date.now();

  return cache;
};

// ── オンボーディング用人気選手リスト ──────────────────────────────────────────
// リーグ上位野手 + 投手をまとめて返す。チーム選択なしで選手を発見できるようにする。

const fetchOnboardingPlayers = async ({ hitterLimit = 14, pitcherLimit = 6 } = {}) => {
  const leagueStats = await fetchLeagueStats();

  // 野手: OPS 上位から取得（既にリーダーボードデータなので上位順）
  const topHitters = leagueStats.hitter.players.slice(0, hitterLimit);
  // 投手: ERA 昇順でソート
  const topPitchers = [...leagueStats.pitcher.players]
    .filter((p) => p.era > 0)
    .sort((a, b) => a.era - b.era)
    .slice(0, pitcherLimit);

  // 野手の position + teamId をバッチ取得する
  const hitterIds = topHitters.map((p) => p.playerId);
  const metaMap = {};
  if (hitterIds.length > 0) {
    try {
      const data = await fetchFromMlbApi(
        `https://statsapi.mlb.com/api/v1/people?personIds=${hitterIds.join(",")}`,
        "Failed to fetch onboarding player meta",
      );
      for (const person of data.people || []) {
        metaMap[person.id] = {
          teamId:   person.currentTeam?.id   ?? null,
          position: person.primaryPosition?.abbreviation ?? "",
        };
      }
    } catch { /* メタ取得失敗はスキップ */ }
  }

  const HEADSHOT = (id) =>
    `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;

  const hitters = topHitters.map((p) => ({
    mlbPlayerId: p.playerId,
    fullName:    p.name,
    teamName:    p.team,
    teamId:      metaMap[p.playerId]?.teamId   ?? null,
    position:    metaMap[p.playerId]?.position ?? "",
    playerType:  "hitter",
    imageUrl:    HEADSHOT(p.playerId),
    currentSeasonStats: {
      hitterStats: { ops: p.ops, homeRuns: p.homeRuns, battingAverage: p.avg, rbis: p.rbi },
    },
  }));

  const pitchers = topPitchers.map((p) => ({
    mlbPlayerId: p.playerId,
    fullName:    p.name,
    teamName:    p.team,
    teamId:      null,
    position:    "P",
    playerType:  "pitcher",
    imageUrl:    HEADSHOT(p.playerId),
    currentSeasonStats: {
      pitcherStats: { era: p.era, strikeouts: p.strikeouts, inningsPitched: p.innings },
    },
  }));

  return [...hitters, ...pitchers];
};

module.exports = { fetchLeagueStats, fetchYoungLeaguePlayers, fetchYoungPitchers, fetchOnboardingPlayers };
