import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import PlayerCard from "../components/PlayerCard";
import SkeletonCard from "../components/SkeletonCard";
import { getFavorites } from "../services/api/favoriteApi";
import { getExternalPlayersByTeam } from "../services/api/externalPlayerApi";
import { getRecommendations } from "../services/api/recommendationApi";
import { getCurrentUser } from "../services/api/userApi";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import {
  getApiErrorMessage,
  isUnauthorizedError,
} from "../services/api/apiError";

const SKELETON_COUNTS = { team: 4, favorites: 6, recommendations: 6 };

const EMPTY_STATES = {
  team: {
    icon: "⚾",
    title: "No team players loaded",
    desc: "Choose a favorite team to see its roster here.",
    action: { label: "Choose Team", to: "/onboarding/team" },
  },
  favorites: {
    icon: "⭐",
    title: "No favorite players yet",
    desc: "Search for players and save them to your list.",
    action: { label: "Search Players", to: "/search" },
  },
  recommendations: {
    icon: "🤖",
    title: "No recommendations yet",
    desc: "Save more favorites to unlock personalized picks.",
    action: { label: "Find Players", to: "/search" },
  },
};

function EmptyState({ config }) {
  return (
    <div className="home-empty-state">
      <span className="empty-state-icon">{config.icon}</span>
      <p className="empty-state-title">{config.title}</p>
      <p className="empty-state-desc">{config.desc}</p>
      <Link className="home-link secondary" to={config.action.to}>
        {config.action.label}
      </Link>
    </div>
  );
}

function SectionHeading({ title, desc, count, viewAllTo }) {
  return (
    <div className="section-heading-row">
      <div className="section-heading">
        <h2>
          {title}
          {count > 0 && <span className="count-badge">{count}</span>}
        </h2>
        <p>{desc}</p>
      </div>
      {viewAllTo && (
        <Link className="view-all-link" to={viewAllTo}>
          View All →
        </Link>
      )}
    </div>
  );
}

function HomePage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const token = getAuthToken();

  useEffect(() => {
    const fetchPersonalizedHome = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setErrorMessage("");

        const currentUser = await getCurrentUser(token);
        const [favoritePlayers, recommendedPlayers] = await Promise.all([
          getFavorites(token),
          getRecommendations(token),
        ]);

        setUser(currentUser);
        setFavorites(favoritePlayers.slice(0, 6));
        setRecommendations(recommendedPlayers);

        if (currentUser.favoriteTeam?.id) {
          const players = await getExternalPlayersByTeam(
            currentUser.favoriteTeam.id,
          );
          setTeamPlayers(players);
        }
      } catch (error) {
        console.error("Home personalization error:", error);
        if (isUnauthorizedError(error)) {
          clearAuthData();
          setErrorMessage("Your login session expired. Please login again.");
          return;
        }
        setErrorMessage(
          getApiErrorMessage(error, "Failed to load personalized home data."),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalizedHome();
  }, [token]);

  const renderPlayerGrid = (players, skeletonCount, emptyConfig) => {
    if (loading) {
      return (
        <div className="player-list">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (players.length === 0) {
      return <EmptyState config={emptyConfig} />;
    }

    return (
      <div className="player-list">
        {players.map((player) => (
          <PlayerCard
            key={player.playerId || player.mlbPlayerId}
            player={player}
          />
        ))}
      </div>
    );
  };

  // --- Guest view ---
  if (!token) {
    return (
      <div className="home-page px-6 py-16">
        <section className="home-hero w-full max-w-4xl px-8 py-12 md:px-14 md:py-16">
          <img
            src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg"
            alt="MLB"
            className="mx-auto mb-6"
            style={{ width: "72px", height: "72px", objectFit: "contain" }}
          />

          <p className="home-kicker text-sm">MERN Portfolio Project</p>
          <h1 className="text-4xl leading-tight font-black tracking-tight md:text-6xl">
            MLB Favorite Player Hub
          </h1>
          <p className="home-description mt-6 text-base md:text-lg">
            Search MLB players, open player details, and build your own
            personalized favorite player list.
          </p>

          <div className="feature-cards">
            <div className="feature-card">
              <span className="feature-card-icon">🔍</span>
              <h3>Search</h3>
              <p>
                Search any MLB player from the official Stats API in real time.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-card-icon">⭐</span>
              <h3>Track</h3>
              <p>
                Save favorite players with personal notes and tags to MongoDB.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-card-icon">🤖</span>
              <h3>Discover</h3>
              <p>Get personalized recommendations based on your favorites.</p>
            </div>
          </div>

          <div className="home-actions mt-8">
            <Link className="home-link" to="/register">
              Get Started
            </Link>
            <Link className="home-link" to="/login">
              Login
            </Link>
          </div>
        </section>

        <div className="home-tech-stack">
          {[
            "MongoDB",
            "Express",
            "React",
            "Node.js",
            "MLB Stats API",
            "JWT",
          ].map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </div>
    );
  }

  // --- Logged-in view ---
  return (
    <div className="home-page px-6 py-16">
      <section className="home-hero w-full max-w-4xl px-8 py-10 md:px-14 md:py-12">
        <p className="home-kicker text-sm">Personalized Home</p>
        <h1 className="text-4xl leading-tight font-black tracking-tight md:text-6xl">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>

        {user?.favoriteTeam?.name && (
          <div className="player-card-team mt-4">
            {user.favoriteTeam.id && (
              <img
                src={`https://www.mlbstatic.com/team-logos/${user.favoriteTeam.id}.svg`}
                alt={user.favoriteTeam.name}
                style={{ width: "24px", height: "24px" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <span>{user.favoriteTeam.name}</span>
          </div>
        )}

        {user && !user.hasCompletedOnboarding && (
          <div className="home-onboarding-callout mt-6">
            <strong>Onboarding is not complete yet.</strong>
            <p>Choose your favorite team and at least 3 favorite players.</p>
            <Link className="home-link" to="/onboarding/team">
              Complete Onboarding
            </Link>
          </div>
        )}

        <div className="home-actions mt-7">
          <Link className="home-link secondary" to="/favorites">
            View Favorites
          </Link>
          <Link className="home-link secondary" to="/onboarding/team">
            Edit Preferences
          </Link>
        </div>
      </section>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="home-content">
        <section className="home-player-section home-team-section">
          <SectionHeading
            title="Your Favorite Team"
            desc={
              user?.favoriteTeam?.name
                ? `${user.favoriteTeam.name} players from the MLB API.`
                : "Choose a favorite team to show team players here."
            }
            count={teamPlayers.length}
            viewAllTo={user?.favoriteTeam?.id ? "/team-roster" : undefined}
          />
          {loading ? (
            <div className="player-list-carousel">
              {Array.from({ length: SKELETON_COUNTS.team }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : teamPlayers.length === 0 ? (
            <EmptyState config={EMPTY_STATES.team} />
          ) : (
            <div className="player-list-carousel">
              {teamPlayers.map((player) => (
                <PlayerCard
                  key={
                    player.playerId || player.mlbPlayerId
                  }
                  player={player}
                />
              ))}
            </div>
          )}
        </section>

        <section className="home-player-section home-favorites-section">
          <SectionHeading
            title="Your Favorite Players"
            desc="Players saved from Search, Detail, or Onboarding."
            count={favorites.length}
            viewAllTo="/favorites"
          />
          {renderPlayerGrid(
            favorites,
            SKELETON_COUNTS.favorites,
            EMPTY_STATES.favorites,
          )}
        </section>

        <section className="home-player-section home-recommendations-section">
          <SectionHeading
            title="Recommended For You"
            desc="Recommended from your favorite team, current stats, and saved players."
            count={recommendations.length}
          />
          {renderPlayerGrid(
            recommendations,
            SKELETON_COUNTS.recommendations,
            EMPTY_STATES.recommendations,
          )}
        </section>
      </div>
    </div>
  );
}

export default HomePage;
