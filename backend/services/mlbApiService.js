const MLB_PLAYER_SEARCH_URL =
  "https://statsapi.mlb.com/api/v1/people/search";
const MLB_PLAYER_STATS_URL = "https://statsapi.mlb.com/api/v1/people";
const DEFAULT_STATS_SEASON = "2024";

const buildPlayerHeadshotUrl = (playerId) => {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/${playerId}/headshot/67/current`;
};

const formatExternalPlayer = (player) => {
  return {
    externalId: player.id,
    name: player.fullName,
    team: player.currentTeam?.name || "Unknown",
    position: player.primaryPosition?.name || "Unknown",
    playerType:
      player.primaryPosition?.name === "Pitcher" ? "pitcher" : "hitter",
    image: buildPlayerHeadshotUrl(player.id),
    birthDate: player.birthDate,
    height: player.height,
    weight: player.weight,
    active: player.active,
    mlbDebutDate: player.mlbDebutDate,
  };
};

const formatExternalStats = (stats) => {
  const hittingSplit = stats.find(
    (stat) => stat.group?.displayName === "hitting",
  )?.splits?.[0];
  const pitchingSplit = stats.find(
    (stat) => stat.group?.displayName === "pitching",
  )?.splits?.[0];

  return {
    hitterStats: hittingSplit
      ? {
          battingAverage: hittingSplit.stat.avg,
          homeRuns: hittingSplit.stat.homeRuns,
          rbis: hittingSplit.stat.rbi,
        }
      : undefined,
    pitcherStats: pitchingSplit
      ? {
          era: pitchingSplit.stat.era,
          strikeouts: pitchingSplit.stat.strikeOuts,
          inningsPitched: pitchingSplit.stat.inningsPitched,
        }
      : undefined,
  };
};

const fetchExternalPlayerStats = async (
  playerId,
  season = DEFAULT_STATS_SEASON,
) => {
  try {
    const url = `${MLB_PLAYER_STATS_URL}/${playerId}/stats?stats=season&group=hitting,pitching&season=${season}`;

    const response = await fetch(url);

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    return formatExternalStats(data.stats || []);
  } catch (error) {
    console.error("External player stats error:", error.message);
    return {};
  }
};

const fetchExternalPlayers = async (searchText) => {
  const url = `${MLB_PLAYER_SEARCH_URL}?names=${encodeURIComponent(
    searchText,
  )}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch players from MLB API");
  }

  const data = await response.json();

  const players = (data.people || []).map(formatExternalPlayer);

  return Promise.all(
    players.map(async (player) => {
      const stats = await fetchExternalPlayerStats(player.externalId);

      return {
        ...player,
        ...stats,
      };
    }),
  );
};

module.exports = { fetchExternalPlayers };
