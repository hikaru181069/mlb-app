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

      {player.stats && (
        <div className="stats">
          <p>AVG: {player.stats.battingAverage}</p>
          <p>HR: {player.stats.homeRuns}</p>
          <p>RBI: {player.stats.rbis}</p>
        </div>
      )}
    </Link>
  );
}

export default PlayerCard;
