import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ExternalPlayerCard from "../components/ExternalPlayerCard";
import SkeletonCard from "../components/SkeletonCard";
import { completeOnboarding } from "../services/api/userApi";
import { createFavoritesBulk } from "../services/api/favoriteApi";
import { getOnboardingPlayers } from "../services/api/externalPlayerApi";
import { getAuthToken, markOnboardingCompleted } from "../utils/authStorage";

function OnboardingFavoritesPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    getOnboardingPlayers()
      .then(setPlayers)
      .catch((err) => setErrorMessage(err.message || "Failed to load players."))
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const handleTogglePlayer = (player) => {
    const alreadySelected = selectedPlayers.some(
      (p) => p.mlbPlayerId === player.mlbPlayerId,
    );
    setSelectedPlayers((prev) =>
      alreadySelected
        ? prev.filter((p) => p.mlbPlayerId !== player.mlbPlayerId)
        : [...prev, player],
    );
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

  const isReady = selectedPlayers.length >= 3;

  return (
    <div className="home-page px-6 py-10">
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">Get Started</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          Pick Your Favorites
        </h1>
        <p className="home-description mt-4 text-base">
          Choose 3 or more players you like. We'll use them to find players with a similar playstyle.
        </p>

        <div className="onboarding-count-row mt-5">
          <span className={`onboarding-count-badge ${isReady ? "onboarding-count-badge--ok" : ""}`}>
            {selectedPlayers.length} selected
          </span>
          <span className="onboarding-count-hint">
            {isReady
              ? "Ready! You can add more or continue."
              : `${3 - selectedPlayers.length} more needed`}
          </span>
        </div>
      </section>

      <div className="home-content mt-2 w-full">
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="player-list">
          {loading
            ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
            : players.map((player) => {
                const selected = selectedPlayers.some(
                  (p) => p.mlbPlayerId === player.mlbPlayerId,
                );
                return (
                  <div
                    className={`selectable-player ${selected ? "selected" : ""}`}
                    key={player.mlbPlayerId}
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
                      className={`home-link ${selected ? "" : "secondary"}`}
                      type="button"
                      onClick={() => handleTogglePlayer(player)}
                    >
                      {selected ? "✓ Selected" : "Select"}
                    </button>
                  </div>
                );
              })}
        </div>

        <div className="home-actions mt-8">
          <button
            className="home-link"
            type="button"
            disabled={loading || !isReady}
            onClick={handleComplete}
          >
            {loading ? "Saving…" : "Continue →"}
          </button>
          <Link className="home-link secondary" to="/">
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OnboardingFavoritesPage;
