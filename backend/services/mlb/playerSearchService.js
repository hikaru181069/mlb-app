const { buildPlayerSearchUrl } = require("./mlbUrlBuilder");
const { fetchFromMlbApi } = require("./mlbClient");
const {
  formatExternalPlayer,
  formatExternalStats,
} = require("./playerFormatter");
const {
  fetchExternalPlayerDetails,
  fetchExternalPlayerStats,
} = require("./playerStatsService");

const fetchExternalPlayers = async (searchText) => {
  const data = await fetchFromMlbApi(
    buildPlayerSearchUrl(searchText),
    "Failed to fetch players from MLB API",
  );

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

module.exports = {
  fetchExternalPlayers,
};
