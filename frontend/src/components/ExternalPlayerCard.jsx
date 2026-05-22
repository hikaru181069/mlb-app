import { Link } from "react-router-dom";
import PlayerStats from "./PlayerStats";

function ExternalPlayerCard({ player, alreadySaved, detailState }) {
  const detailPath = `/players/${player.externalId}`;

  return (
    <article className="player-card">
      <Link className="player-card-link" to={detailPath} state={detailState}>
        {player.image && (
          <div className="player-image-wrapper">
            <img className="player-image" src={player.image} alt={player.name} />
          </div>
        )}

        <h2>{player.name}</h2>

        {alreadySaved && <p className="saved-badge">⭐ Saved</p>}

        {typeof player.active === "boolean" && (
          <p className={player.active ? "active-badge" : "inactive-badge"}>
            {player.active ? "Active" : "Inactive"}
          </p>
        )}

        <p>Team: {player.team}</p>
        <p>Position: {player.position}</p>

        {player.recommendationReasons?.length > 0 && (
          <p className="external-note">
            {player.recommendationReasons.slice(0, 2).join(" / ")}
          </p>
        )}

        <PlayerStats player={player} />
      </Link>

      <Link
        className="home-link secondary mt-4 inline-flex items-center justify-center"
        to={detailPath}
        state={detailState}
      >
        View Detail →
      </Link>
    </article>
  );
}

export default ExternalPlayerCard;
