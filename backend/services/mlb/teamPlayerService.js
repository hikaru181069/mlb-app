const { buildTeamRosterUrl } = require("./mlbUrlBuilder");
const { fetchFromMlbApi } = require("./mlbClient");
const {
  formatExternalPlayer,
  formatExternalStats,
} = require("./playerFormatter");
const {
  fetchExternalPlayerDetails,
  fetchExternalPlayerStats,
} = require("./playerStatsService");

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

    if (
      toNumber(player.pitcherStats.strikeouts) >= 40 ||
      (era > 0 && era <= 3.5)
    ) {
      reasons.push("Strong pitcher profile");
    }
  }

  // Simple popularity boost. Later this can be replaced by FastAPI.
  if (
    [
      "Shohei Ohtani",
      "Mookie Betts",
      "Freddie Freeman",
      "Aaron Judge",
    ].includes(player.name)
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

const fetchExternalPlayersByTeam = async (teamId) => {
  const data = await fetchFromMlbApi(
    buildTeamRosterUrl(teamId),
    "Failed to fetch team roster from MLB API",
  );
  const roster = data.roster || [];

  return Promise.all(
    roster.map(async (rosterPlayer) => {
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
  { limit = 12, hitterLimit = 8, pitcherLimit = 4, excludePlayerIds = [] } = {},
) => {
  const data = await fetchFromMlbApi(
    buildTeamRosterUrl(teamId),
    "Failed to fetch team roster from MLB API",
  );
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
};
