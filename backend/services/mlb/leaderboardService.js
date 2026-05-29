const { fetchFromMlbApi } = require("./mlbClient");

const MLB_LEADERS_URL = "https://statsapi.mlb.com/api/v1/stats/leaders";
const CURRENT_SEASON = new Date().getFullYear().toString();

const HITTING_CATEGORIES = [
  "homeRuns",
  "battingAverage",
  "runsBattedIn",
  "hits",
  "stolenBases",
  "onBasePlusSlugging",
];

const PITCHING_CATEGORIES = [
  "strikeouts",
  "earnedRunAverage",
  "wins",
  "saves",
  "walksAndHitsPerInningPitched",
  "inningsPitched",
];

const CATEGORY_LABELS = {
  homeRuns: { label: "Home Runs", abbr: "HR" },
  battingAverage: { label: "Batting Average", abbr: "AVG" },
  runsBattedIn: { label: "RBI", abbr: "RBI" },
  hits: { label: "Hits", abbr: "H" },
  stolenBases: { label: "Stolen Bases", abbr: "SB" },
  onBasePlusSlugging: { label: "OPS", abbr: "OPS" },
  strikeouts: { label: "Strikeouts", abbr: "K" },
  earnedRunAverage: { label: "ERA", abbr: "ERA" },
  wins: { label: "Wins", abbr: "W" },
  saves: { label: "Saves", abbr: "SV" },
  walksAndHitsPerInningPitched: { label: "WHIP", abbr: "WHIP" },
  inningsPitched: { label: "Innings Pitched", abbr: "IP" },
};

const buildLeadersUrl = ({ categories, statGroup, limit }) => {
  const params = new URLSearchParams({
    leaderCategories: categories.join(","),
    season: CURRENT_SEASON,
    statGroup,
    limit: String(limit),
  });
  return `${MLB_LEADERS_URL}?${params}`;
};

const formatLeaders = (leagueLeaders) => {
  return leagueLeaders.map((cat) => ({
    category: cat.leaderCategory,
    label: CATEGORY_LABELS[cat.leaderCategory]?.label ?? cat.leaderCategory,
    abbr: CATEGORY_LABELS[cat.leaderCategory]?.abbr ?? cat.leaderCategory,
    leaders: (cat.leaders || []).map((entry) => ({
      rank: entry.rank,
      value: entry.value,
      playerId: entry.person?.id,
      playerName: entry.person?.fullName,
      teamName: entry.team?.name,
      teamId: entry.team?.id,
    })),
  }));
};

const fetchHittingLeaders = async (limit = 10) => {
  const data = await fetchFromMlbApi(
    buildLeadersUrl({ categories: HITTING_CATEGORIES, statGroup: "hitting", limit }),
    "Failed to fetch hitting leaders",
  );
  return formatLeaders(data.leagueLeaders || []);
};

const fetchPitchingLeaders = async (limit = 10) => {
  const data = await fetchFromMlbApi(
    buildLeadersUrl({ categories: PITCHING_CATEGORIES, statGroup: "pitching", limit }),
    "Failed to fetch pitching leaders",
  );
  return formatLeaders(data.leagueLeaders || []);
};

module.exports = { fetchHittingLeaders, fetchPitchingLeaders };
