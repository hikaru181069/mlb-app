import { Link } from "react-router-dom";
import PlayerStats from "./PlayerStats";

function ExternalPlayerCard({ player, alreadySaved, detailState }) {
  const detailPath = `/players/${player.externalId}`;

  return (
    <article className="player-card">
      <Link className="player-card-link" to={detailPath} state={detailState}>
        {player.image && (
          <img className="player-image" src={player.image} alt={player.name} />
        )}

        <h2>{player.name}</h2>
        {alreadySaved && (
          <p className="external-note">Already saved in your favorites</p>
        )}
        <p>Team: {player.team}</p>
        <p>Position: {player.position}</p>
        <p>Birth Date: {player.birthDate || "Unknown"}</p>
        <p>Height: {player.height || "Unknown"}</p>
        <p>Weight: {player.weight || "Unknown"}</p>
        <p>MLB Debut: {player.mlbDebutDate || "Unknown"}</p>
        {player.playerType && <p>Type: {player.playerType}</p>}
        {typeof player.active === "boolean" && (
          <p>{player.active ? "Active roster player" : "Inactive player"}</p>
        )}
        {player.recommendationReasons?.length > 0 && (
          <p className="external-note">
            {player.recommendationReasons.slice(0, 2).join(" / ")}
          </p>
        )}
        <PlayerStats player={player} />
      </Link>

      <Link
        className="add-player-link mt-4 inline-flex items-center justify-center transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        to={detailPath}
        state={detailState}
      >
        View Detail
      </Link>
    </article>
  );
}

export default ExternalPlayerCard;
