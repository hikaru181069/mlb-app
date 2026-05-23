import { Link } from "react-router-dom";
import PlayerStats from "./PlayerStats";

function FavoritePlayerCard({ favorite }) {
  const editPath = `/favorites/${favorite._id}`;

  return (
    <article className="player-card">
      <Link className="player-card-link" to={editPath}>
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
        <p>Team: {favorite.teamName}</p>
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

      <div className="mt-4 text-center">
        <Link className="home-link secondary" to={editPath}>
          Edit →
        </Link>
      </div>
    </article>
  );
}

export default FavoritePlayerCard;
