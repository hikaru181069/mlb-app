const {
  fetchExternalPlayerFullDetails,
} = require("./playerDetailService");
const { fetchExternalPlayers } = require("./playerSearchService");
const {
  fetchExternalPlayersByTeam,
  fetchRecommendedPlayersByTeam,
} = require("./teamPlayerService");

module.exports = {
  fetchExternalPlayerFullDetails,
  fetchExternalPlayers,
  fetchExternalPlayersByTeam,
  fetchRecommendedPlayersByTeam,
};
