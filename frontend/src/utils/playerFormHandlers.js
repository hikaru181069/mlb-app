export const updatePlayerFormData = (formData, name, value) => {
  if (name === "battingAverage" || name === "homeRuns" || name === "rbis") {
    return {
      ...formData,
      hitterStats: {
        ...formData.hitterStats,
        [name]: value,
      },
    };
  }

  if (name === "era" || name === "strikeouts" || name === "inningsPitched") {
    return {
      ...formData,
      pitcherStats: {
        ...formData.pitcherStats,
        [name]: value,
      },
    };
  }

  return {
    ...formData,
    [name]: value,
  };
};

export const createPlayerRequestBody = (formData) => {
  return {
    name: formData.name,
    team: formData.team,
    position: formData.position,
    image:
      formData.image ||
      `https://placehold.co/300x300?text=${encodeURIComponent(formData.name)}`,
    externalId: formData.externalId ? Number(formData.externalId) : undefined,
    source: formData.source || "Manual",
    playerType: formData.playerType,
    hitterStats:
      formData.playerType === "hitter"
        ? {
            battingAverage: formData.hitterStats.battingAverage,
            homeRuns: Number(formData.hitterStats.homeRuns),
            rbis: Number(formData.hitterStats.rbis),
          }
        : undefined,
    pitcherStats:
      formData.playerType === "pitcher"
        ? {
            era: formData.pitcherStats.era,
            strikeouts: Number(formData.pitcherStats.strikeouts),
            inningsPitched: formData.pitcherStats.inningsPitched,
          }
        : undefined,
  };
};

export const createFavoriteRequestBody = (formData) => {
  return {
    mlbPlayerId: Number(formData.externalId),
    fullName: formData.name,
    teamName: formData.team || "Unknown",
    position: formData.position || "Unknown",
    imageUrl: formData.image,
    playerType: formData.playerType,
    currentSeasonStats: formData.currentSeasonStats,
    careerStats: formData.careerStats,
    recentGames: formData.recentGames || [],
    baseballSavantUrl: formData.baseballSavantUrl || "",
    hitterStats:
      formData.playerType === "hitter"
        ? {
            battingAverage: formData.hitterStats.battingAverage,
            homeRuns: Number(formData.hitterStats.homeRuns || 0),
            rbis: Number(formData.hitterStats.rbis || 0),
          }
        : undefined,
    pitcherStats:
      formData.playerType === "pitcher"
        ? {
            era: formData.pitcherStats.era,
            strikeouts: Number(formData.pitcherStats.strikeouts || 0),
            inningsPitched: formData.pitcherStats.inningsPitched,
          }
        : undefined,
    source: formData.source || "MLB Stats API",
  };
};
