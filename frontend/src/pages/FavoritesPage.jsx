import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import FavoritePlayerCard from "../components/FavoritePlayerCard";
import SkeletonCard from "../components/SkeletonCard";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import { getFavorites } from "../services/api/favoriteApi";
import {
  getApiErrorMessage,
  isUnauthorizedError,
} from "../services/api/apiError";

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const token = getAuthToken();
  const navigate = useNavigate();

  const handleToggleSelect = (favorite) => {
    const id = favorite.mlbPlayerId;
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 2
        ? [...prev, id]
        : prev,
    );
  };

  const handleCompare = () => {
    if (selectedIds.length === 2) {
      navigate(`/compare?p1=${selectedIds[0]}&p2=${selectedIds[1]}`);
    }
  };

  const handleToggleCompareMode = () => {
    setCompareMode((prev) => !prev);
    setSelectedIds([]);
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getFavorites(token);

        setFavorites(data);
      } catch (error) {
        console.error("Fetch favorites error:", error);
        if (isUnauthorizedError(error)) {
          clearAuthData();
          setErrorMessage("Your login session expired. Please login again.");
          return;
        }

        setFavorites([]);
        setErrorMessage(getApiErrorMessage(error, "Failed to load favorites."));
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [token]);

  return (
    <div className="home-page px-6 py-12">
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">Your Collection</p>
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Favorites
          </h1>
          {!loading && favorites.length > 0 && (
            <span className="count-badge--favorites">{favorites.length}</span>
          )}
        </div>
        <p className="home-description mt-4 text-base">
          Manage your saved MLB players, notes, and tags.
        </p>
        {!loading && favorites.length >= 2 && (
          <div className="home-actions mt-6">
            <button
              type="button"
              className={`home-link secondary${compareMode ? " home-link--active" : ""}`}
              onClick={handleToggleCompareMode}
            >
              {compareMode ? "Cancel Compare" : "Compare Players"}
            </button>
            {compareMode && selectedIds.length === 2 && (
              <button
                type="button"
                className="home-link"
                onClick={handleCompare}
              >
                Compare Selected →
              </button>
            )}
          </div>
        )}
        {compareMode && (
          <p className="compare-mode-hint">
            {selectedIds.length === 0 && "Select 2 players to compare."}
            {selectedIds.length === 1 && "Select 1 more player."}
            {selectedIds.length === 2 && "Ready! Click Compare Selected."}
          </p>
        )}
      </section>

      <div className="home-content mt-2 w-full">
        {!token && (
          <div className="home-empty-state">
            <span className="empty-state-icon">🔒</span>
            <p className="empty-state-title">Login required</p>
            <p className="empty-state-desc">Please login to view your favorites.</p>
            <Link className="home-link secondary" to="/login">Go to Login</Link>
          </div>
        )}

        {!loading && errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}

        {loading && (
          <div className="favorite-list">
            {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && token && !errorMessage && favorites.length === 0 && (
          <div className="home-empty-state">
            <span className="empty-state-icon">⭐</span>
            <p className="empty-state-title">No favorites yet</p>
            <p className="empty-state-desc">
              Search for players and save them to your list.
            </p>
            <Link className="home-link secondary" to="/search">Search Players</Link>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <div className="player-list">
            {favorites.map((favorite) => (
              <FavoritePlayerCard
                key={favorite._id}
                favorite={favorite}
                selectable={compareMode}
                selected={selectedIds.includes(favorite.mlbPlayerId)}
                onToggle={handleToggleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;
