const { formatRecommendation } = require("./recommendationFormatter");

const addUniqueRecommendations = ({
  candidates,
  existingIds,
  recommendations,
  reason,
}) => {
  for (const candidate of candidates) {
    const playerId =
      candidate.mlbPlayerId || candidate.playerId;

    if (!playerId || existingIds.has(Number(playerId))) {
      continue;
    }

    const alreadyRecommended = recommendations.some(
      (player) => Number(player.playerId) === Number(playerId),
    );

    if (alreadyRecommended) {
      continue;
    }

    recommendations.push(formatRecommendation(candidate, reason));

    if (recommendations.length >= 3) {
      break;
    }
  }
};

module.exports = {
  addUniqueRecommendations,
};
