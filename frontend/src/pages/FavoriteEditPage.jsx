import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getAuthToken } from "../utils/authStorage";
import {
  deleteFavorite,
  getFavorites,
  updateFavorite,
} from "../services/api/favoriteApi";
import { mlbTeams } from "../services/mlbTeams";

function FavoriteEditPage() {
  const { favoriteId } = useParams();
  const navigate = useNavigate();
  const token = getAuthToken();

  const [favorite, setFavorite] = useState(null);
  const [formData, setFormData] = useState({ note: "", favoriteReason: "", tags: "" });
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchFavorite = async () => {
      try {
        setLoading(true);
        const data = await getFavorites(token);
        const found = data.find((f) => f._id === favoriteId);
        if (!found) {
          setErrorMessage("Favorite not found.");
          return;
        }
        setFavorite(found);
        setFormData({
          note: found.note || "",
          favoriteReason: found.favoriteReason || "",
          tags: (found.tags || []).join(", "),
        });
      } catch (error) {
        console.error("Fetch favorite error:", error);
        setErrorMessage("Failed to load favorite.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchFavorite();
  }, [favoriteId, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaveMessage("");
      setErrorMessage("");
      const updated = await updateFavorite(favoriteId, {
        note: formData.note,
        favoriteReason: formData.favoriteReason,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }, token);
      setFavorite(updated);
      setSaveMessage("Saved.");
    } catch (error) {
      console.error("Update favorite error:", error);
      setErrorMessage(error.message || "Failed to save.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this favorite?")) return;
    try {
      await deleteFavorite(favoriteId, token);
      navigate("/favorites");
    } catch (error) {
      console.error("Delete favorite error:", error);
      setErrorMessage(error.message || "Failed to delete.");
    }
  };

  if (loading) {
    return (
      <div className="home-page px-6 py-12">
        <div className="player-detail mx-auto w-full max-w-3xl animate-pulse">
          <div className="h-5 w-28 rounded bg-ctp-surface1 mb-8" />
          <div className="flex gap-6">
            <div className="rounded-[10%] bg-ctp-surface1 flex-shrink-0" style={{ width: "min(260px, 100%)", height: "347px" }} />
            <div className="flex flex-col gap-3 flex-1">
              <div className="h-8 w-2/3 rounded bg-ctp-surface1" />
              <div className="h-4 w-1/2 rounded bg-ctp-surface1" />
              <div className="h-4 w-1/3 rounded bg-ctp-surface1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage && !favorite) {
    return (
      <div className="home-page px-6 py-12">
        <p className="error-message">{errorMessage}</p>
        <div className="home-actions">
          <Link className="home-link secondary" to="/favorites">← Back to Favorites</Link>
        </div>
      </div>
    );
  }

  const teamEntry = mlbTeams.find(
    (t) => t.name.toLowerCase() === (favorite.teamName || "").toLowerCase()
  );

  return (
    <div className="home-page px-6 py-12">
      <div className="detail-actions">
        <Link className="detail-nav-link" to="/favorites">
          ← Back to Favorites
        </Link>
      </div>

      <div className="player-detail mx-auto w-full max-w-3xl">
        {/* Hero */}
        <div className="favorite-edit-hero">
          {favorite.imageUrl && (
            <div className="player-image-wrapper favorite-edit-image flex-shrink-0">
              <img className="player-image" src={favorite.imageUrl} alt={favorite.fullName} />
            </div>
          )}

          <div className="favorite-edit-info">
            <h1>{favorite.fullName}</h1>
            <div className="favorite-edit-meta">
              <span className="player-card-team">
                {teamEntry && (
                  <img
                    src={`https://www.mlbstatic.com/team-logos/${teamEntry.id}.svg`}
                    alt={favorite.teamName}
                    className="player-card-team-logo"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                <span>{favorite.teamName || "Unknown"}</span>
              </span>
              <span> · {favorite.position || "Unknown"}</span>
            </div>

            {favorite.tags?.length > 0 && (
              <div className="tag-list" style={{ justifyContent: "center" }}>
                {favorite.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}

            {favorite.playerType === "hitter" && favorite.hitterStats && (
              <div className="stats">
                <p>AVG: {favorite.hitterStats.battingAverage} | HR: {favorite.hitterStats.homeRuns} | RBI: {favorite.hitterStats.rbis}</p>
              </div>
            )}
            {favorite.playerType === "pitcher" && favorite.pitcherStats && (
              <div className="stats">
                <p>ERA: {favorite.pitcherStats.era} | SO: {favorite.pitcherStats.strikeouts} | IP: {favorite.pitcherStats.inningsPitched}</p>
              </div>
            )}

            <Link
              className="home-link secondary"
              to={`/players/${favorite.mlbPlayerId}`}
              state={{ from: `/favorites/${favoriteId}`, fromLabel: "Back to Edit" }}
            >
              View MLB Detail →
            </Link>
          </div>
        </div>

        {/* Edit form */}
        <section className="detail-section">
          <h2>My Memo</h2>
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

            <div className="favorite-form-actions">
              <button className="home-link" type="submit">Save Memo</button>
              {saveMessage && <p className="status-message" style={{ margin: 0 }}>{saveMessage}</p>}
            </div>
          </form>
        </section>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {/* Bottom actions */}
        <div className="favorite-edit-bottom-actions">
          <button className="home-link danger" type="button" onClick={handleDelete}>
            Delete this favorite
          </button>
        </div>
      </div>
    </div>
  );
}

export default FavoriteEditPage;
