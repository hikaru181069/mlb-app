import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
  const token = getAuthToken();

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
            <span className="count-badge">{favorites.length}</span>
          )}
        </div>
        <p className="home-description mt-4 text-base">
          Manage your saved MLB players, notes, and tags.
        </p>
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
              <FavoritePlayerCard key={favorite._id} favorite={favorite} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;
