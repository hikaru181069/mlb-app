const { fetchFromMlbApi } = require("./mlbClient");
const { getOaaMap }       = require("./baseballSavantService");

const MLB_STATS_URL  = "https://statsapi.mlb.com/api/v1/stats";
const CURRENT_SEASON = new Date().getFullYear().toString();

// ── キャッシュ ────────────────────────────────────────────────────────────

const CACHE_TTL = 24 * 60 * 60 * 1000;
let cache = null;
let cacheTime = null;

// ── 全野手スタッツ取得 ────────────────────────────────────────────────────
// リーダーボード方式（上位200名のカテゴリ別リスト）から
// playerPool=All 方式（全選手の全スタット一括取得）に変更。
// 旧方式の問題：HR上位だがOPS上位でない選手のopsが0になっていた。

async function fetchAllHitterStats() {
  const params = new URLSearchParams({
    stats:      "season",
    group:      "hitting",
    sportId:    "1",
    season:     CURRENT_SEASON,
    playerPool: "All",
    gameType:   "R",
    limit:      "2000",
  });

  const data = await fetchFromMlbApi(
    `${MLB_STATS_URL}?${params}`,
    "Failed to fetch all hitter stats",
  );

  const splits = data.stats?.[0]?.splits ?? [];
  const oaaMap = getOaaMap();

  // 打席数が少なすぎる選手（投手の打席など）をフィルタリング
  const players = splits
    .filter((s) => s.player?.id && (parseInt(s.stat?.atBats) || 0) >= 30)
    .map((s) => ({
      playerId:    s.player.id,
      name:        s.player.fullName || "",
      team:        s.team?.name     || "",
      ops:         parseFloat(s.stat.ops)          || 0,
      homeRuns:    parseInt(s.stat.homeRuns)        || 0,
      stolenBases: parseInt(s.stat.stolenBases)     || 0,
      avg:         parseFloat(s.stat.avg)           || 0,
      rbi:         parseInt(s.stat.rbi)             || 0,
      oaa:         oaaMap[s.player.id]              ?? 0,
    }));

  // パーセンタイル計算用の分布配列（ゼロを除外して意味のある値のみ）
  const distributions = {
    ops:         players.map((p) => p.ops).filter((v) => v > 0),
    homeRuns:    players.map((p) => p.homeRuns),
    stolenBases: players.map((p) => p.stolenBases),
    avg:         players.map((p) => p.avg).filter((v) => v > 0),
    rbi:         players.map((p) => p.rbi),
  };

  return { players, distributions };
}

// ── 全投手スタッツ取得 ────────────────────────────────────────────────────

async function fetchAllPitcherStats() {
  const params = new URLSearchParams({
    stats:      "season",
    group:      "pitching",
    sportId:    "1",
    season:     CURRENT_SEASON,
    playerPool: "All",
    gameType:   "R",
    limit:      "2000",
  });

  const data = await fetchFromMlbApi(
    `${MLB_STATS_URL}?${params}`,
    "Failed to fetch all pitcher stats",
  );

  const splits = data.stats?.[0]?.splits ?? [];

  // 投球回数が少ない選手（1試合だけ登板など）をフィルタリング
  const players = splits
    .filter((s) => s.player?.id && parseFloat(s.stat?.inningsPitched || 0) >= 10)
    .map((s) => ({
      playerId:   s.player.id,
      name:       s.player.fullName || "",
      team:       s.team?.name     || "",
      era:        parseFloat(s.stat.era)            || 0,
      whip:       parseFloat(s.stat.whip)           || 0,
      strikeouts: parseInt(s.stat.strikeOuts)       || 0,
      walks:      parseInt(s.stat.baseOnBalls)      || 0,
      wins:       parseInt(s.stat.wins)             || 0,
      innings:    parseFloat(s.stat.inningsPitched) || 0,
    }));

  const distributions = {
    era:        players.map((p) => p.era).filter((v) => v > 0),
    whip:       players.map((p) => p.whip).filter((v) => v > 0),
    strikeouts: players.map((p) => p.strikeouts),
    wins:       players.map((p) => p.wins),
    innings:    players.map((p) => p.innings).filter((v) => v > 0),
  };

  return { players, distributions };
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
    fetchAllHitterStats(),
    fetchAllPitcherStats(),
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
