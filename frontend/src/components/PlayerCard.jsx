import { Link } from "react-router-dom";
import PlayerStats from "./PlayerStats";

function PlayerCard({ player }) {
  return (
    <Link className="player-card" to={`/players/${player._id}`}>
      {player.image && (
        <img className="player-image" src={player.image} alt={player.name} />
      )}
      <h2>{player.name}</h2>
      <p>Team: {player.team}</p>
      <p>Position: {player.position}</p>

      <PlayerStats player={player} />
    </Link>
  );
}

export default PlayerCard;
