const MLB_PLAYER_SEARCH_URL =
  "https://statsapi.mlb.com/api/v1/people/search";
const MLB_PLAYER_STATS_URL = "https://statsapi.mlb.com/api/v1/people";
const MLB_TEAM_URL = "https://statsapi.mlb.com/api/v1/teams";
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
          gamesPlayed: hittingSplit.stat.gamesPlayed,
          battingAverage: hittingSplit.stat.avg,
          ops: hittingSplit.stat.ops,
          homeRuns: hittingSplit.stat.homeRuns,
          rbis: hittingSplit.stat.rbi,
        }
      : undefined,
    pitcherStats: pitchingSplit
      ? {
          gamesPlayed: pitchingSplit.stat.gamesPlayed,
          wins: pitchingSplit.stat.wins,
          era: pitchingSplit.stat.era,
          strikeouts: pitchingSplit.stat.strikeOuts,
          inningsPitched: pitchingSplit.stat.inningsPitched,
        }
      : undefined,
  };
};

const toNumber = (value) => {
  const number = Number(value);

  return Number.isNaN(number) ? 0 : number;
};

const hasStats = (stats) => {
  return Boolean(stats && Object.values(stats).some((value) => value));
};

const calculateRecommendationScore = (player) => {
  const reasons = ["Recommended from your favorite team"];
  let score = 0;

  if (player.active) {
    score += 20;
    reasons.push("Active roster player");
  }

  if (hasStats(player.hitterStats) || hasStats(player.pitcherStats)) {
    score += 18;
    reasons.push("Has current season stats");
  }

  if (player.playerType === "hitter" && player.hitterStats) {
    score += Math.min(toNumber(player.hitterStats.gamesPlayed), 80) * 0.25;
    score += toNumber(player.hitterStats.homeRuns) * 1.5;
    score += toNumber(player.hitterStats.battingAverage) * 40;
    score += toNumber(player.hitterStats.ops) * 30;

    if (
      toNumber(player.hitterStats.homeRuns) >= 10 ||
      toNumber(player.hitterStats.ops) >= 0.75
    ) {
      reasons.push("Strong hitter profile");
    }
  }

  if (player.playerType === "pitcher" && player.pitcherStats) {
    score += Math.min(toNumber(player.pitcherStats.gamesPlayed), 40) * 0.5;
    score += toNumber(player.pitcherStats.wins) * 2;
    score += toNumber(player.pitcherStats.strikeouts) * 0.25;

    const era = toNumber(player.pitcherStats.era);

    if (era > 0) {
      score += Math.max(0, 5 - era) * 8;
    }

    if (toNumber(player.pitcherStats.strikeouts) >= 40 || (era > 0 && era <= 3.5)) {
      reasons.push("Strong pitcher profile");
    }
  }

  // Simple popularity boost. Later this can be replaced by FastAPI.
  if (
    ["Shohei Ohtani", "Mookie Betts", "Freddie Freeman", "Aaron Judge"].includes(
      player.name,
    )
  ) {
    score += 25;
    reasons.push("Popular star player");
  }

  return {
    recommendationScore: Math.round(score),
    recommendationReasons: reasons,
  };
};

const chooseBalancedPlayers = ({
  hitters,
  pitchers,
  limit,
  hitterLimit,
  pitcherLimit,
}) => {
  const selectedHitters = hitters.slice(0, hitterLimit);
  const selectedPitchers = pitchers.slice(0, pitcherLimit);
  const selected = [...selectedHitters, ...selectedPitchers];

  if (selected.length < limit) {
    const selectedIds = new Set(selected.map((player) => player.externalId));
    const remainingPlayers = [...hitters, ...pitchers]
      .filter((player) => !selectedIds.has(player.externalId))
      .sort((a, b) => b.recommendationScore - a.recommendationScore);

    selected.push(...remainingPlayers.slice(0, limit - selected.length));
  }

  return selected
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);
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

const fetchExternalPlayersByTeam = async (teamId) => {
  const response = await fetch(`${MLB_TEAM_URL}/${teamId}/roster`);

  if (!response.ok) {
    throw new Error("Failed to fetch team roster from MLB API");
  }

  const data = await response.json();
  const roster = data.roster || [];
  const firstPlayers = roster.slice(0, 12);

  return Promise.all(
    firstPlayers.map(async (rosterPlayer) => {
      const detailedPlayer =
        (await fetchExternalPlayerDetails(rosterPlayer.person.id)) ||
        rosterPlayer.person;
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

const fetchRecommendedPlayersByTeam = async (
  teamId,
  {
    limit = 12,
    hitterLimit = 8,
    pitcherLimit = 4,
    excludePlayerIds = [],
  } = {},
) => {
  const response = await fetch(`${MLB_TEAM_URL}/${teamId}/roster`);

  if (!response.ok) {
    throw new Error("Failed to fetch team roster from MLB API");
  }

  const data = await response.json();
  const roster = data.roster || [];
  const excludedIds = new Set(excludePlayerIds.map(Number));

  if (roster.length === 0) {
    return [];
  }

  const players = await Promise.all(
    roster.map(async (rosterPlayer) => {
      const playerId = rosterPlayer.person?.id;

      if (!playerId || excludedIds.has(Number(playerId))) {
        return null;
      }

      try {
        const detailedPlayer =
          (await fetchExternalPlayerDetails(playerId)) || rosterPlayer.person;
        const basePlayer = formatExternalPlayer(detailedPlayer);
        const playerType =
          basePlayer.position === "Pitcher" || basePlayer.position === "P"
            ? "pitcher"
            : "hitter";
        const seasonStats = await fetchExternalPlayerStats({
          playerId: basePlayer.externalId,
        });
        const formattedSeasonStats = formatExternalStats(seasonStats);
        const player = {
          ...basePlayer,
          playerType,
          ...formattedSeasonStats,
          currentSeasonStats: formattedSeasonStats,
        };
        const recommendation = calculateRecommendationScore(player);

        return {
          ...player,
          ...recommendation,
        };
      } catch (error) {
        console.error(
          `Recommended player fetch error (${playerId}):`,
          error.message,
        );
        return null;
      }
    }),
  );

  const validPlayers = players.filter(Boolean);
  const hitters = validPlayers
    .filter((player) => player.playerType === "hitter")
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
  const pitchers = validPlayers
    .filter((player) => player.playerType === "pitcher")
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  return chooseBalancedPlayers({
    hitters,
    pitchers,
    limit,
    hitterLimit,
    pitcherLimit,
  });
};

module.exports = {
  fetchExternalPlayersByTeam,
  fetchRecommendedPlayersByTeam,
  fetchExternalPlayers,
  fetchExternalPlayerFullDetails,
};
