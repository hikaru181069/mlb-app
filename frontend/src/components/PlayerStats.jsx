function PlayerStats({ player }) {
  if (player.playerType === "hitter" && player.hitterStats) {
    return (
      <div className="stats">
        <p>
          AVG:
          {player.hitterStats.battingAverage}
        </p>
        <p>HR: {player.hitterStats.homeRuns}</p>
        <p>RBI: {player.hitterStats.rbis}</p>
      </div>
    );
  }

  if (player.playerType === "pitcher" && player.pitcherStats) {
    return (
      <div className="stats">
        <p>ERA: {player.pitcherStats.era}</p>
        <p>SO: {player.pitcherStats.strikeouts}</p>
        <p>
          IP:
          {player.pitcherStats.inningsPitched}
        </p>
      </div>
    );
  }

  return null;
}

export default PlayerStats;
