import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppNav from "../components/AppNav";
import ExternalPlayerCard from "../components/ExternalPlayerCard";
import { completeOnboarding, getCurrentUser } from "../services/api/userApi";
import { createFavoritesBulk } from "../services/api/favoriteApi";
import { getRecommendedPlayersByTeam } from "../services/api/externalPlayerApi";
import {
  getAuthToken,
  markOnboardingCompleted,
} from "../utils/authStorage";

function OnboardingFavoritesPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const currentUser = await getCurrentUser(token);

        if (!currentUser.favoriteTeam?.id) {
          navigate("/onboarding/team");
          return;
        }

        const teamPlayers = await getRecommendedPlayersByTeam(
          currentUser.favoriteTeam.id,
        );

        setUser(currentUser);
        setPlayers(teamPlayers);
      } catch (error) {
        console.error("Fetch onboarding players error:", error);
        setErrorMessage(error.message || "Failed to load team players.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamPlayers();
  }, [navigate, token]);

  const handleTogglePlayer = (player) => {
    const alreadySelected = selectedPlayers.some(
      (selectedPlayer) => selectedPlayer.externalId === player.externalId,
    );

    if (alreadySelected) {
      setSelectedPlayers((currentPlayers) =>
        currentPlayers.filter(
          (selectedPlayer) => selectedPlayer.externalId !== player.externalId,
        ),
      );
      return;
    }

    setSelectedPlayers((currentPlayers) => [...currentPlayers, player]);
  };

  const handleComplete = async () => {
    if (selectedPlayers.length < 3) {
      setErrorMessage("Please choose at least 3 favorite players.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      await createFavoritesBulk(selectedPlayers, token);
      await completeOnboarding(token);
      markOnboardingCompleted();

      navigate("/favorites");
    } catch (error) {
      console.error("Complete onboarding error:", error);
      setErrorMessage(error.message || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <AppNav />

      <Link className="back-link" to="/">
        ← Back to Home
      </Link>

      <h1>Choose Favorite Players</h1>
      <p className="status-message">
        Choose recommended players from {user?.favoriteTeam?.name || "your team"}.
        We prioritize active players, current stats, stars, and a hitter/pitcher balance.
        Select at least 3 players that interest you.
      </p>

      {loading && <p className="status-message">Loading...</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <p className="status-message">
        Selected: {selectedPlayers.length} / 3 minimum
      </p>

      <div className="player-list">
        {players.map((player) => {
          const selected = selectedPlayers.some(
            (selectedPlayer) => selectedPlayer.externalId === player.externalId,
          );

          return (
            <div
              className={`selectable-player ${selected ? "selected" : ""}`}
              key={player.externalId}
            >
              <ExternalPlayerCard
                player={player}
                alreadySaved={selected}
                detailState={{
                  from: "/onboarding/favorites",
                  fromLabel: "Back to Onboarding",
                }}
              />
              <button
                className="add-player-link"
                type="button"
                onClick={() => handleTogglePlayer(player)}
              >
                {selected ? "Selected" : "Select Player"}
              </button>
            </div>
          );
        })}
      </div>

      <button
        className="add-player-link onboarding-action"
        type="button"
        disabled={loading || selectedPlayers.length < 3}
        onClick={handleComplete}
      >
        Complete Onboarding
      </button>
    </div>
  );
}

export default OnboardingFavoritesPage;
