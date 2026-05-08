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

  return (
    <article className="player-card favorite-card">
      {favorite.imageUrl && (
        <img
          className="player-image"
          src={favorite.imageUrl}
          alt={favorite.fullName}
        />
      )}

      <h2>{favorite.fullName}</h2>
      <p className="source-badge">{favorite.source}</p>
      <p>Team: {favorite.teamName}</p>
      <p>Position: {favorite.position}</p>

      <h3>Current Season Stats</h3>
      <PlayerStats player={favorite} />

      <Link
        className="back-link favorite-detail-link"
        to={`/players/${favorite._id}`}
      >
        View Detail
      </Link>

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
