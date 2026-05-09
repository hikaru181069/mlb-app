import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";
import FavoritePlayerCard from "../components/FavoritePlayerCard";
import { API_URL } from "../utils/apiConfig";
import { getAuthToken } from "../utils/authStorage";

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

        const response = await fetch(`${API_URL}/api/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load favorites.");
        }

        setFavorites(data);
      } catch (error) {
        console.error("Fetch favorites error:", error);
        setFavorites([]);
        setErrorMessage("Failed to load favorites.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [token]);

  const handleUpdateFavorite = async (favoriteId, updateData) => {
    try {
      setErrorMessage("");

      const response = await fetch(`${API_URL}/api/favorites/${favoriteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update favorite.");
      }

      setFavorites((currentFavorites) =>
        currentFavorites.map((favorite) =>
          favorite._id === favoriteId ? data : favorite,
        ),
      );
    } catch (error) {
      console.error("Update favorite error:", error);
      setErrorMessage("Failed to update favorite.");
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

      const response = await fetch(`${API_URL}/api/favorites/${favoriteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete favorite.");
      }

      setFavorites((currentFavorites) =>
        currentFavorites.filter((favorite) => favorite._id !== favoriteId),
      );
    } catch (error) {
      console.error("Delete favorite error:", error);
      setErrorMessage("Failed to delete favorite.");
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
