// [Phase 12] Onboarding Step 1: チーム選択
// 旧来の .app クラスから home-page/home-hero パターンに統一。
// ステップインジケーターでユーザーが今どこにいるか把握できるようにした。
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
    <div className="home-page px-6 py-10">
      {/* ステップインジケーター */}
      <div className="onboarding-steps">
        <span className="onboarding-step onboarding-step--active">
          1. Choose Team
        </span>
        <span className="onboarding-step-sep">→</span>
        <span className="onboarding-step onboarding-step--pending">
          2. Pick Players
        </span>
      </div>

      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">Step 1 of 2</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          Choose Your Team
        </h1>
        <p className="home-description mt-4 text-base">
          We'll use this to suggest players in the next step.
        </p>
      </section>

      <div className="home-content mt-2 w-full">
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

        {errorMessage && <p className="error-message mt-4">{errorMessage}</p>}

        <div className="home-actions mt-8">
          <button
            className="home-link"
            type="button"
            disabled={loading || !selectedTeam}
            onClick={handleSubmit}
          >
            {loading ? "Saving…" : "Continue →"}
          </button>
          <Link className="home-link secondary" to="/">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OnboardingTeamPage;
