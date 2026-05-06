import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PlayerForm from "../components/PlayerForm";
import { initialPlayerFormData } from "../utils/playerFormDefaults";
import {
  createPlayerRequestBody,
  updatePlayerFormData,
} from "../utils/playerFormHandlers";
import { getAuthToken } from "../utils/authStorage";
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

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_URL}/api/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createPlayerRequestBody(formData)),
      });

      if (!response.ok) {
        throw new Error("Failed to create player.");
      }
      navigate("/players");
    } catch (error) {
      console.error("Create player error:", error);
      setErrorMessage("Failed to create player.");
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
      <Link className="back-link" to="/players">
        ← Back to players
      </Link>

      <h1>Add Player</h1>

      {externalPlayer?.source && (
        <p className="status-message">
          Imported from {externalPlayer.source}. Please add stats before
          saving.
        </p>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <PlayerForm
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        loading={loading}
        buttonText="Add Player"
      />
    </div>
  );
}

export default AddPlayerPage;
