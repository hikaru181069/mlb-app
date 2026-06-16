const {
  fetchExternalPlayerFullDetails,
} = require("./playerDetailService");
const { fetchExternalPlayers, fetchPlayerSuggestions } = require("./playerSearchService");
const {
  fetchExternalPlayersByTeam,
} = require("./teamPlayerService");

module.exports = {
  fetchExternalPlayerFullDetails,
  fetchExternalPlayers,
  fetchPlayerSuggestions,
  fetchExternalPlayersByTeam,
};
