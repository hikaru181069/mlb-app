import { Link } from "react-router-dom";
import PlayerStats from "./PlayerStats";

function PlayerCard({ player }) {
  const playerId =
    player.playerId || player.mlbPlayerId || player.externalId || player._id;
  const name = player.fullName || player.name;
  const team = player.teamName || player.team;
  const position = player.position;
  const image = player.imageUrl || player.image;

  return (
    <Link
      className="player-card transition duration-200 hover:-translate-y-1 hover:shadow-2xl"
      to={`/players/${playerId}`}
    >
      {image && <img className="player-image" src={image} alt={name} />}
      <h2>{name}</h2>
      {player.source && player.source !== "Manual" && (
        <p className="source-badge">{player.source}</p>
      )}
      <p>Team: {team}</p>
      <p>Position: {position}</p>
      {player.shortBio && <p>{player.shortBio}</p>}

      <PlayerStats player={player} />
    </Link>
  );
}

export default PlayerCard;
