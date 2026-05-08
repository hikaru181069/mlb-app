function PlayerStats({ player }) {
  const hitterStats = player.hitterStats || player.seasonStats;
  const pitcherStats = player.pitcherStats || player.seasonStats;

  if (player.playerType === "hitter" && hitterStats) {
    return (
      <div className="stats">
        <p>
          AVG:
          {hitterStats.battingAverage}
        </p>
        <p>HR: {hitterStats.homeRuns}</p>
        <p>RBI: {hitterStats.rbis}</p>
      </div>
    );
  }

  if (player.playerType === "pitcher" && pitcherStats) {
    return (
      <div className="stats">
        <p>ERA: {pitcherStats.era}</p>
        <p>SO: {pitcherStats.strikeouts}</p>
        <p>
          IP:
          {pitcherStats.inningsPitched}
        </p>
      </div>
    );
  }

  return null;
}

export default PlayerStats;
