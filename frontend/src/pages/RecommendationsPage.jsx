import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bot, Sparkles, Star } from "lucide-react";

import PageHeader from "../components/PageHeader";
import PlayerCard from "../components/PlayerCard";
import SkeletonCard from "../components/SkeletonCard";
import {
  getFutureStars,
  getRecommendations,
} from "../services/api/recommendationApi";
import {
  getApiErrorMessage,
  isUnauthorizedError,
} from "../services/api/apiError";
import { clearAuthData, getAuthToken } from "../utils/authStorage";

function FutureStarCard({ player }) {
  return (
    <article className="future-star-card">
      <div className="future-star-card-top">
        <span className="future-star-badge">
          <Sparkles size={14} strokeWidth={2} />
          Rising Star
        </span>
        <span className="future-star-score">
          {player.similarityPercentage}% match
        </span>
      </div>

      <h3>{player.fullName}</h3>
      <p className="future-star-org">
        {player.organization}{player.position ? ` · ${player.position}` : ""}
      </p>

      <dl className="future-star-meta">
        <div>
          <dt>Age</dt>
          <dd>{player.age}</dd>
        </div>
        <div>
          <dt>OPS</dt>
          <dd>{player.stats?.ops?.toFixed?.(3) ?? "-"}</dd>
        </div>
        <div>
          <dt>HR</dt>
          <dd>{player.stats?.homeRuns ?? "-"}</dd>
        </div>
        <div>
          <dt>AVG</dt>
          <dd>{player.stats?.avg?.toFixed?.(3) ?? "-"}</dd>
        </div>
      </dl>

      {player.reasons?.length > 0 && (
        <div className="future-star-reasons">
          {player.reasons.slice(0, 4).map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      )}
    </article>
  );
}

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [futureStars, setFutureStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const token = getAuthToken();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [regularResult, futureStarsResult] = await Promise.allSettled([
          getRecommendations(token),
          getFutureStars(token),
        ]);

        if (!active) return;

        if (regularResult.status === "fulfilled") {
          setRecommendations(regularResult.value);
        }

        if (futureStarsResult.status === "fulfilled") {
          setFutureStars(futureStarsResult.value);
        }

        if (
          regularResult.status === "rejected" &&
          futureStarsResult.status === "rejected"
        ) {
          throw regularResult.reason;
        }
      } catch (error) {
        if (!active) return;
        console.error("Recommendations page error:", error);

        if (isUnauthorizedError(error)) {
          clearAuthData();
          setErrorMessage("Your login session expired. Please login again.");
          return;
        }

        setErrorMessage(
          getApiErrorMessage(error, "Failed to load recommendations."),
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="app-screen">
        <PageHeader
          kicker="Personalized"
          title="Recommendations"
          subtitle="Login to see players matched to your favorites."
        />
        <div className="screen-body px-6 py-6 w-full">
          <div className="tool-placeholder">
            <p>Login to view personalized recommendations.</p>
          </div>
          <div className="home-actions mt-6">
            <Link className="home-link" to="/login">
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <PageHeader
        accentColor="var(--ctp-teal)"
        backTo="/"
        backLabel="Home"
        kicker="Personalized"
        title="Recommendations"
        subtitle="Discover MLB players and Future Stars based on your favorites."
      />

      <div className="screen-body recommendations-page px-6 py-6 w-full">
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <section className="recommendation-section">
          <div className="section-heading-row">
            <div className="section-heading">
              <h2>
                MLB Picks
                {recommendations.length > 0 && (
                  <span className="count-badge">{recommendations.length}</span>
                )}
              </h2>
              <p>Current MLB players selected from your team and saved players.</p>
            </div>
            <Bot className="recommendation-section-icon" size={24} />
          </div>

          {loading ? (
            <div className="player-list">
              {Array.from({ length: 3 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="player-list">
              {recommendations.map((player) => (
                <PlayerCard
                  key={player.playerId || player.mlbPlayerId}
                  player={player}
                />
              ))}
            </div>
          ) : (
            <div className="tool-placeholder">
              <p>Save favorite players to unlock MLB recommendations.</p>
            </div>
          )}
        </section>

        <section className="recommendation-section future-stars-section">
          <div className="section-heading-row">
            <div className="section-heading">
              <h2>
                Rising Stars
                {futureStars.length > 0 && (
                  <span className="count-badge">{futureStars.length}</span>
                )}
              </h2>
              <p>Young MLB players (age 25 and under) who match your play style preferences.</p>
            </div>
            <Star className="recommendation-section-icon" size={24} />
          </div>

          {loading ? (
            <div className="future-stars-grid">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="future-star-card future-star-card--loading">
                  <span className="skeleton-block" />
                  <span className="skeleton-block" />
                  <span className="skeleton-block" />
                </div>
              ))}
            </div>
          ) : futureStars.length > 0 ? (
            <div className="future-stars-grid">
              {futureStars.map((player) => (
                <FutureStarCard key={player.playerId} player={player} />
              ))}
            </div>
          ) : (
            <div className="tool-placeholder">
              <p>Future Stars will appear after favorites are available and FastAPI is running.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default RecommendationsPage;
