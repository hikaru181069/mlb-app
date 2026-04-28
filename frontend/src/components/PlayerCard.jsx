import { Link } from "react-router-dom";

function PlayerCard({ player }) {
  return (
    <Link className="player-card" to={`/players/${player._id}`}>
      {player.image && (
        <img className="player-image" src={player.image} alt={player.name} />
      )}
      <h2>{player.name}</h2>
      <p>Team: {player.team}</p>
      <p>Position: {player.position}</p>

      {player.playerType === "hitter" && player.hitterStats && (
        <div className="stats">
          <p>AVG: {player.hitterStats.battingAverage}</p>
          <p>HR: {player.hitterStats.homeRuns}</p>
          <p>RBI: {player.hitterStats.rbis}</p>
        </div>
      )}

      {player.playerType === "pitcher" && player.pitcherStats && (
        <div className="stats">
          <p>ERA: {player.pitcherStats.era}</p>
          <p>SO: {player.pitcherStats.strikeouts}</p>
          <p>IP: {player.pitcherStats.inningsPitched}</p>
        </div>
      )}
    </Link>
  );
}

export default PlayerCard;
