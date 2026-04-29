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
