import { useState } from "react";
import { Link } from "react-router-dom";
import PlayerStats from "./PlayerStats";

function FavoritePlayerCard({
  favorite,
  handleUpdateFavorite,
  handleDeleteFavorite,
}) {
  const [formData, setFormData] = useState({
    note: favorite.note || "",
    favoriteReason: favorite.favoriteReason || "",
    tags: (favorite.tags || []).join(", "),
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    handleUpdateFavorite(favorite._id, {
      note: formData.note,
      favoriteReason: formData.favoriteReason,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  const tags = favorite.tags || [];

  return (
    <article className="player-card favorite-card">
      <div className="favorite-card-main">
        {favorite.imageUrl && (
          <img
            className="player-image favorite-image"
            src={favorite.imageUrl}
            alt={favorite.fullName}
          />
        )}

        <div className="favorite-card-info">
          <p className="source-badge">{favorite.source || "MLB API"}</p>
          <h2>{favorite.fullName}</h2>
          <p>Team: {favorite.teamName}</p>
          <p>Position: {favorite.position}</p>

          {tags.length > 0 && (
            <div className="tag-list">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}

          <Link
            className="back-link favorite-detail-link"
            to={`/players/${favorite._id}`}
          >
            View Detail
          </Link>
        </div>
      </div>

      <section className="favorite-card-section">
        <h3>Current Season Stats</h3>
        <PlayerStats player={favorite} />
      </section>

      {(favorite.note || favorite.favoriteReason) && (
        <section className="favorite-card-section favorite-memo-preview">
          {favorite.note && (
            <p>
              <strong>Note:</strong> {favorite.note}
            </p>
          )}
          {favorite.favoriteReason && (
            <p>
              <strong>Reason:</strong> {favorite.favoriteReason}
            </p>
          )}
        </section>
      )}

      <form className="favorite-edit-form" onSubmit={handleSubmit}>
        <label>
          Note
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Write a short note..."
          />
        </label>

        <label>
          Favorite Reason
          <textarea
            name="favoriteReason"
            value={formData.favoriteReason}
            onChange={handleChange}
            placeholder="Why do you like this player?"
          />
        </label>

        <label>
          Tags
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="power, two-way, favorite"
          />
        </label>

        <button type="submit">Save Memo</button>
      </form>

      <button
        className="delete-button"
        type="button"
        onClick={() => handleDeleteFavorite(favorite._id)}
      >
        Delete Favorite
      </button>
    </article>
  );
}

export default FavoritePlayerCard;
