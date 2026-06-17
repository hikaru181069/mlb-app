const { fetchFromMlbApi } = require("./mlbClient");

const LEADERS_URL = "https://statsapi.mlb.com/api/v1/stats/leaders";
const PEOPLE_URL  = "https://statsapi.mlb.com/api/v1/people";
const TEAMS_URL   = "https://statsapi.mlb.com/api/v1/teams";
const SEASON      = new Date().getFullYear().toString();

// AAA=11, AA=12
const SPORT_IDS   = [11, 12];
const SPORT_LABEL = { 11: "Triple-A", 12: "Double-A" };

const HITTER_CATEGORIES = [
  "onBasePlusSlugging",
  "homeRuns",
  "stolenBases",
  "battingAverage",
  "runsBattedIn",
];

const CAT_KEY = {
  onBasePlusSlugging: "ops",
  homeRuns:           "homeRuns",
  stolenBases:        "stolenBases",
  battingAverage:     "avg",
  runsBattedIn:       "rbi",
};

const HEADSHOT = (id) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;

// ── キャッシュ ─────────────────────────────────────────────────────────────

let cache     = null;
let cacheTime = 0;
const TTL_MS  = 24 * 60 * 60 * 1000;

// ── ヘルパー ───────────────────────────────────────────────────────────────

const toNum = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// team.id → { parentOrgName, parentOrgId, level } のキャッシュ
const teamCache = {};

const getTeamMeta = async (teamId) => {
  if (teamCache[teamId]) return teamCache[teamId];
  try {
    const data = await fetchFromMlbApi(`${TEAMS_URL}/${teamId}`);
    const t    = data.teams?.[0] || {};
    const meta = {
      parentOrgName: t.parentOrgName || "",
      parentOrgId:   t.parentOrgId   || null,
      level:         t.sport?.name   || "",
    };
    teamCache[teamId] = meta;
    return meta;
  } catch {
    return { parentOrgName: "", parentOrgId: null, level: "" };
  }
};

// ── メイン取得関数 ─────────────────────────────────────────────────────────

const fetchProspects = async () => {
  if (cache && Date.now() - cacheTime < TTL_MS) return cache;

  // 1. 各 sportId × カテゴリでリーダーを取得し、playerId をキーにしたマップへ集約
  const playerMap = {};

  for (const sportId of SPORT_IDS) {
    const url = `${LEADERS_URL}?sportId=${sportId}&leaderCategories=${HITTER_CATEGORIES.join(",")}&season=${SEASON}&limit=60`;
    let data;
    try {
      data = await fetchFromMlbApi(url);
    } catch {
      continue;
    }

    for (const cat of data.leagueLeaders || []) {
      const statKey = CAT_KEY[cat.leaderCategory];
      if (!statKey) continue;

      for (const item of cat.leaders || []) {
        const id = item.person?.id;
        if (!id) continue;

        if (!playerMap[id]) {
          playerMap[id] = {
            playerId: id,
            fullName: item.person.fullName || "",
            teamId:   item.team?.id   || null,
            teamName: item.team?.name || "",
            sportId,
            ops: 0, homeRuns: 0, stolenBases: 0, avg: 0, rbi: 0,
          };
        }

        playerMap[id][statKey] = toNum(item.value);
        // sportId は AAA 優先（数値が小さいほど上位リーグ）
        if (sportId < playerMap[id].sportId) playerMap[id].sportId = sportId;
      }
    }
  }

  const players = Object.values(playerMap);

  // 2. age + position をバッチ取得（50人ずつ）
  const ids = players.map((p) => p.playerId);
  const peopleMap = {};
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50).join(",");
    try {
      const data = await fetchFromMlbApi(`${PEOPLE_URL}?personIds=${chunk}`);
      for (const person of data.people || []) {
        peopleMap[person.id] = {
          age:      person.currentAge || 0,
          position: person.primaryPosition?.abbreviation || "",
        };
      }
    } catch { /* スキップ */ }
  }

  // 3. チームメタ（親球団）を並列取得
  const uniqueTeamIds = [...new Set(players.map((p) => p.teamId).filter(Boolean))];
  await Promise.all(uniqueTeamIds.map(getTeamMeta));

  // 4. 最終データを組み立て
  const prospects = players.map((p) => {
    const meta  = peopleMap[p.playerId] || {};
    const tMeta = p.teamId ? teamCache[p.teamId] || {} : {};
    return {
      playerId:      p.playerId,
      fullName:      p.fullName,
      level:         tMeta.level || SPORT_LABEL[p.sportId] || "MiLB",
      team:          p.teamName,
      teamId:        p.teamId,
      parentOrg:     tMeta.parentOrgName || "",
      parentOrgId:   tMeta.parentOrgId   || null,
      age:           meta.age      || 0,
      position:      meta.position || "",
      ops:           p.ops,
      homeRuns:      p.homeRuns,
      stolenBases:   p.stolenBases,
      avg:           p.avg,
      rbi:           p.rbi,
      imageUrl:      HEADSHOT(p.playerId),
    };
  });

  // OPS 降順でソート（スコアリング前の並び順）
  prospects.sort((a, b) => b.ops - a.ops);

  cache     = prospects;
  cacheTime = Date.now();
  return prospects;
};

module.exports = { fetchProspects };
