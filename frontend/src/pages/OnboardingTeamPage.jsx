import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import TeamCard from "../components/TeamCard";
import { mlbTeams } from "../services/mlbTeams";
import { updateFavoriteTeam } from "../services/api/userApi";
import { getAuthToken } from "../utils/authStorage";

function OnboardingTeamPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!selectedTeam) {
      setErrorMessage("Please choose one favorite team.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      await updateFavoriteTeam(selectedTeam, token);
      navigate("/onboarding/favorites");
    } catch (error) {
      console.error("Update favorite team error:", error);
      setErrorMessage(error.message || "Failed to save favorite team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Link className="back-link" to="/">
        ← Back to Home
      </Link>

      <h1>Choose Your Favorite Team</h1>
      <p className="status-message">
        Choose one team. We will use it to suggest players during onboarding.
      </p>

      <div className="team-grid">
        {mlbTeams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            selected={selectedTeam?.id === team.id}
            handleSelectTeam={setSelectedTeam}
          />
        ))}
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <button
        className="add-player-link onboarding-action"
        type="button"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? "Saving..." : "Save Team and Continue"}
      </button>
    </div>
  );
}

export default OnboardingTeamPage;
