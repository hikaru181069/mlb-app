import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";
import FavoritePlayerCard from "../components/FavoritePlayerCard";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import {
  deleteFavorite,
  getFavorites,
  updateFavorite,
} from "../services/api/favoriteApi";
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

  const handleUpdateFavorite = async (favoriteId, updateData) => {
    try {
      setErrorMessage("");

      const data = await updateFavorite(favoriteId, updateData, token);

      setFavorites((currentFavorites) =>
        currentFavorites.map((favorite) =>
          favorite._id === favoriteId ? data : favorite,
        ),
      );
    } catch (error) {
      console.error("Update favorite error:", error);
      setErrorMessage(getApiErrorMessage(error, "Failed to update favorite."));
    }
  };

  const handleDeleteFavorite = async (favoriteId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this favorite?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      await deleteFavorite(favoriteId, token);

      setFavorites((currentFavorites) =>
        currentFavorites.filter((favorite) => favorite._id !== favoriteId),
      );
    } catch (error) {
      console.error("Delete favorite error:", error);
      setErrorMessage(getApiErrorMessage(error, "Failed to delete favorite."));
    }
  };

  return (
    <div className="app">
      <AppNav />

      <Link className="back-link" to="/">
        ← Back to Home
      </Link>

      <h1>Favorites</h1>
      <p className="description">
        Manage your saved MLB players, notes, reasons, and tags.
      </p>

      {!token && (
        <p className="error-message">Please login to view your favorites.</p>
      )}
      {loading && <p className="status-message">Loading...</p>}
      {!loading && errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {!loading && token && !errorMessage && favorites.length === 0 && (
        <p className="status-message">No favorites yet.</p>
      )}

      {token && favorites.length > 0 && (
        <section className="favorites-summary">
          <div>
            <span className="summary-number">{favorites.length}</span>
            <p>Saved Players</p>
          </div>
          <div>
            <span className="summary-number">
              {favorites.filter((favorite) => favorite.note).length}
            </span>
            <p>Players With Notes</p>
          </div>
          <div>
            <span className="summary-number">
              {favorites.filter((favorite) => favorite.favoriteReason).length}
            </span>
            <p>Players With Reasons</p>
          </div>
        </section>
      )}

      <div className="favorite-list">
        {favorites.map((favorite) => (
          <FavoritePlayerCard
            key={favorite._id}
            favorite={favorite}
            handleUpdateFavorite={handleUpdateFavorite}
            handleDeleteFavorite={handleDeleteFavorite}
          />
        ))}
      </div>
    </div>
  );
}

export default FavoritesPage;
