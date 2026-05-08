const MLB_PLAYER_SEARCH_URL =
  "https://statsapi.mlb.com/api/v1/people/search";
const MLB_PLAYER_STATS_URL = "https://statsapi.mlb.com/api/v1/people";
const CURRENT_SEASON = new Date().getFullYear().toString();

const buildPlayerHeadshotUrl = (playerId) => {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/${playerId}/headshot/67/current`;
};

const buildBaseballSavantUrl = (player) => {
  const nameSlug = player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return `https://baseballsavant.mlb.com/savant-player/${nameSlug}-${player.id}`;
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
    baseballSavantUrl: buildBaseballSavantUrl(player),
  };
};

const formatExternalStats = (stats = []) => {
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

const formatRecentGames = (stats = [], playerType = "hitter") => {
  const preferredGroup = playerType === "pitcher" ? "pitching" : "hitting";
  const preferredSplits =
    stats.find((stat) => stat.group?.displayName === preferredGroup)?.splits ||
    [];
  const fallbackSplits = stats.flatMap((stat) => stat.splits || []);
  const splits = preferredSplits.length > 0 ? preferredSplits : fallbackSplits;

  return [...splits]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((split) => ({
      date: split.date,
      opponent: split.opponent?.name || "Unknown",
      summary: split.stat?.summary || "No summary",
      result: split.isWin ? "W" : "L",
    }));
};

const fetchExternalPlayerDetails = async (playerId) => {
  const response = await fetch(
    `${MLB_PLAYER_STATS_URL}/${playerId}?hydrate=currentTeam`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch player details from MLB API");
  }

  const data = await response.json();

  return data.people?.[0];
};

const fetchExternalPlayerStats = async ({
  playerId,
  statsType = "season",
  season = CURRENT_SEASON,
}) => {
  try {
    const seasonQuery = statsType === "career" ? "" : `&season=${season}`;
    const url = `${MLB_PLAYER_STATS_URL}/${playerId}/stats?stats=${statsType}&group=hitting,pitching${seasonQuery}`;

    const response = await fetch(url);

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    return data.stats || [];
  } catch (error) {
    console.error("External player stats error:", error.message);
    return [];
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

  return Promise.all(
    (data.people || []).map(async (searchResultPlayer) => {
      const detailedPlayer =
        (await fetchExternalPlayerDetails(searchResultPlayer.id)) ||
        searchResultPlayer;
      const player = formatExternalPlayer(detailedPlayer);
      const seasonStats = await fetchExternalPlayerStats({
        playerId: player.externalId,
      });
      const formattedSeasonStats = formatExternalStats(seasonStats);

      return {
        ...player,
        ...formattedSeasonStats,
        currentSeasonStats: formattedSeasonStats,
      };
    }),
  );
};

const fetchExternalPlayerFullDetails = async (playerId) => {
  const detailedPlayer = await fetchExternalPlayerDetails(playerId);
  const player = formatExternalPlayer(detailedPlayer);
  const [seasonStats, careerStats, gameLogStats] = await Promise.all([
    fetchExternalPlayerStats({ playerId }),
    fetchExternalPlayerStats({ playerId, statsType: "career" }),
    fetchExternalPlayerStats({ playerId, statsType: "gameLog" }),
  ]);
  const formattedSeasonStats = formatExternalStats(seasonStats);

  return {
    ...player,
    ...formattedSeasonStats,
    currentSeasonStats: formattedSeasonStats,
    careerStats: formatExternalStats(careerStats),
    recentGames: formatRecentGames(gameLogStats, player.playerType),
  };
};

module.exports = {
  fetchExternalPlayers,
  fetchExternalPlayerFullDetails,
};
