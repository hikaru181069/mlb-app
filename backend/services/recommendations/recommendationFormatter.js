const formatRecommendation = (player, reason) => {
  return {
    playerId: player.mlbPlayerId || player.playerId,
    fullName: player.name || player.fullName,
    team: player.team || player.teamName || "Unknown",
    position: player.position || "Unknown",
    image: player.image || player.imageUrl || "",
    playerType: player.playerType || "hitter",
    hitterStats: player.hitterStats,
    pitcherStats: player.pitcherStats,
    currentSeasonStats: player.currentSeasonStats,
    active: player.active,
    recommendationScore: player.recommendationScore,
    recommendationReasons: player.recommendationReasons,
    archetypes:  player.archetypes  || [],
    styleScores: player.styleScores || null,
    source: "Recommendation",
    reason,
  };
};

module.exports = {
  formatRecommendation,
};
