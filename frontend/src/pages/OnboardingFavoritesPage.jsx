// [Phase 12] Onboarding Step 2: お気に入りプレイヤー選択
// 旧来の .app クラスから home-page/home-hero パターンに統一。
// Step 1 完了マーク + 選択カウントのプログレスバッジを追加。
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ExternalPlayerCard from "../components/ExternalPlayerCard";
import { completeOnboarding, getCurrentUser } from "../services/api/userApi";
import { createFavoritesBulk } from "../services/api/favoriteApi";
import { getRecommendedPlayersByTeam } from "../services/api/externalPlayerApi";
import { getAuthToken, markOnboardingCompleted } from "../utils/authStorage";
import SkeletonCard from "../components/SkeletonCard";

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
      if (!token) { navigate("/login"); return; }
      try {
        setLoading(true);
        setErrorMessage("");
        const currentUser = await getCurrentUser(token);
        if (!currentUser.favoriteTeam?.id) { navigate("/onboarding/team"); return; }
        const teamPlayers = await getRecommendedPlayersByTeam(currentUser.favoriteTeam.id);
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
      (p) => p.mlbPlayerId === player.mlbPlayerId,
    );
    if (alreadySelected) {
      setSelectedPlayers((prev) => prev.filter((p) => p.mlbPlayerId !== player.mlbPlayerId));
    } else {
      setSelectedPlayers((prev) => [...prev, player]);
    }
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
      {/* ステップインジケーター: Step 1 完了済みを表示 */}
      <div className="onboarding-steps">
        <span className="onboarding-step onboarding-step--done">
          ✓ Team Selected
        </span>
        <span className="onboarding-step-sep">→</span>
        <span className="onboarding-step onboarding-step--active">
          2. Pick Players
        </span>
      </div>

      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">Step 2 of 2</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          Pick Your Favorites
        </h1>
        <p className="home-description mt-4 text-base">
          {user?.favoriteTeam?.name
            ? `Recommended players from the ${user.favoriteTeam.name}.`
            : "Loading your team's players…"}
        </p>

        {/* 選択カウントバッジ */}
        <div className="onboarding-count-row mt-5">
          <span className={`onboarding-count-badge ${isReady ? "onboarding-count-badge--ok" : ""}`}>
            {selectedPlayers.length} selected
          </span>
          <span className="onboarding-count-hint">
            {isReady ? "Ready! You can add more or continue." : `${3 - selectedPlayers.length} more needed`}
          </span>
        </div>
      </section>

      <div className="home-content mt-2 w-full">
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {/* スケルトン or プレイヤーグリッド */}
        <div className="player-list">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
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
            {loading ? "Saving…" : "Complete Onboarding →"}
          </button>
          <Link className="home-link secondary" to="/onboarding/team">
            ← Back
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OnboardingFavoritesPage;
