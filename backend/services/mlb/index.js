const {
  fetchExternalPlayerFullDetails,
} = require("./playerDetailService");
const { fetchExternalPlayers, fetchPlayerSuggestions } = require("./playerSearchService");
const {
  fetchExternalPlayersByTeam,
  fetchRecommendedPlayersByTeam,
} = require("./teamPlayerService");

module.exports = {
  fetchExternalPlayerFullDetails,
  fetchExternalPlayers,
  fetchPlayerSuggestions,
  fetchExternalPlayersByTeam,
  fetchRecommendedPlayersByTeam,
};
