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
      {image && (
        <div className="player-image-wrapper">
          <img className="player-image" src={image} alt={name} />
        </div>
      )}
      <h2>{name}</h2>
      <p>Team: {team}</p>
      <p>Position: {position}</p>
      {player.shortBio && <p>{player.shortBio}</p>}
      {player.reason && <p className="external-note">{player.reason}</p>}
      {player.recommendationReasons?.length > 0 && (
        <p className="external-note">
          {player.recommendationReasons.slice(0, 2).join(" / ")}
        </p>
      )}

      <PlayerStats player={player} />
    </Link>
  );
}

export default PlayerCard;
