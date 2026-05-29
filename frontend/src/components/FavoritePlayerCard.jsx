import { Link } from "react-router-dom";
import PlayerStats from "./PlayerStats";
import { mlbTeams } from "../services/mlbTeams";

function FavoritePlayerCard({ favorite, selectable = false, selected = false, onToggle }) {
  const editPath = `/favorites/${favorite._id}`;
  const teamEntry = mlbTeams.find(
    (t) => t.name.toLowerCase() === (favorite.teamName || "").toLowerCase()
  );

  const handleClick = (e) => {
    if (selectable) {
      e.preventDefault();
      onToggle?.(favorite);
    }
  };

  return (
    <article
      className={`player-card ${selectable ? "player-card--selectable" : ""} ${selected ? "player-card--selected" : ""}`}
      onClick={handleClick}
    >
      {selectable && (
        <div className="player-card-checkbox">
          <span className={`compare-checkbox ${selected ? "compare-checkbox--checked" : ""}`}>
            {selected ? "✓" : ""}
          </span>
        </div>
      )}
      <Link className="player-card-link" to={selectable ? "#" : editPath} tabIndex={selectable ? -1 : 0}>
        {favorite.imageUrl && (
          <div className="player-image-wrapper">
            <img
              className="player-image"
              src={favorite.imageUrl}
              alt={favorite.fullName}
            />
          </div>
        )}

        <h2>{favorite.fullName}</h2>
        <div className="player-card-team">
          {teamEntry && (
            <img
              src={`https://www.mlbstatic.com/team-logos/${teamEntry.id}.svg`}
              alt={favorite.teamName}
              className="player-card-team-logo"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
          <span>{favorite.teamName}</span>
        </div>
        <p>Position: {favorite.position}</p>

        {favorite.tags?.length > 0 && (
          <div className="tag-list">
            {favorite.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}

        <PlayerStats player={favorite} />
      </Link>

      {!selectable && (
        <div className="mt-4 text-center">
          <Link className="home-link secondary" to={editPath}>
            Edit →
          </Link>
        </div>
      )}
    </article>
  );
}

export default FavoritePlayerCard;
