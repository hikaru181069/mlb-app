import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PlayerForm from "../components/PlayerForm";
import { initialPlayerFormData } from "../utils/playerFormDefaults";
import {
  createPlayerRequestBody,
  updatePlayerFormData,
} from "../utils/playerFormHandlers";

function AddPlayerPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState(initialPlayerFormData);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(updatePlayerFormData(formData, name, value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch("http://localhost:5001/api/players", {
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
        Back to players
      </Link>

      <h1>Add Player</h1>

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
