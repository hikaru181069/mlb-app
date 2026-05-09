import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PlayerForm from "../components/PlayerForm";
import { initialPlayerFormData } from "../utils/playerFormDefaults";
import {
  createFavoriteRequestBody,
  updatePlayerFormData,
} from "../utils/playerFormHandlers";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import { API_URL } from "../utils/apiConfig";

function AddPlayerPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = getAuthToken();
  const externalPlayer = location.state?.externalPlayer;
  const [formData, setFormData] = useState({
    ...initialPlayerFormData,
    ...externalPlayer,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(updatePlayerFormData(formData, name, value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setErrorMessage("Please login before adding a player.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_URL}/api/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(createFavoriteRequestBody(formData)),
      });

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 401) {
          clearAuthData();
          throw new Error("Your login session is invalid. Please login again.");
        }

        throw new Error(
          data.error || data.message || "Failed to create player.",
        );
      }
      navigate("/favorites");
    } catch (error) {
      console.error("Create player error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="app">
        <p className="error-message">Please login to add a player.</p>

        <Link className="back-link" to="/login">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="app">
      <Link className="back-link" to="/favorites">
        ← Back to favorites
      </Link>

      <h1>Add Favorite Manually</h1>

      {externalPlayer?.source && (
        <p className="status-message">
          Imported from {externalPlayer.source}. You can edit stats before
          saving this favorite.
        </p>
      )}
      {!externalPlayer && (
        <p className="status-message">
          This page is mainly kept for admin-style testing. The recommended flow
          is Search → Detail → Add to Favorites.
        </p>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <PlayerForm
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        loading={loading}
        buttonText="Add to Favorites"
      />
    </div>
  );
}

export default AddPlayerPage;
