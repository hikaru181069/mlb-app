import { Link, useNavigate } from "react-router-dom";
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

const SKELETON_COUNTS = { team: 4, favorites: 5, recommendations: 3 };

function HomePage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
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
        setFavorites(favoritePlayers.slice(0, 5));
        setRecommendations(recommendedPlayers);

        if (currentUser.favoriteTeam?.id) {
          const players = await getExternalPlayersByTeam(
            currentUser.favoriteTeam.id,
          );
          setTeamPlayers(players.slice(0, 4));
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

  const renderPlayerGrid = (players, skeletonCount, emptyMessage, action) => {
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
      return (
        <div className="home-empty-state">
          <p>{emptyMessage}</p>
          {action}
        </div>
      );
    }

    return (
      <div className="player-list">
        {players.map((player) => (
          <PlayerCard
            key={player.playerId || player.mlbPlayerId || player.externalId}
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
          <p className="home-kicker text-sm">MERN Portfolio Project</p>
          <h1 className="text-4xl leading-tight font-black tracking-tight md:text-6xl">
            MLB Favorite Player Hub
          </h1>
          <p className="home-description mt-6 text-base md:text-lg">
            Search MLB players, open player details, and build your own
            personalized favorite player list.
          </p>
          <div className="home-actions mt-7">
            <Link className="home-link" to="/login">
              Login
            </Link>
            <Link className="home-link secondary" to="/register">
              Register
            </Link>
            <Link className="home-link secondary" to="/search">
              Search MLB Players
            </Link>
          </div>
        </section>
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
          <p className="home-description mt-4 text-base md:text-lg">
            ⚾&nbsp;{user.favoriteTeam.name}
          </p>
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
          <Link className="home-link" to="/search">
            Search Players
          </Link>
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
        <section className="home-player-section">
          <div className="section-heading">
            <h2>Your Favorite Team</h2>
            <p>
              {user?.favoriteTeam?.name
                ? `${user.favoriteTeam.name} players from the MLB API.`
                : "Choose a favorite team to show team players here."}
            </p>
          </div>
          {renderPlayerGrid(
            teamPlayers,
            SKELETON_COUNTS.team,
            "No favorite team players loaded yet.",
            <Link className="home-link secondary" to="/onboarding/team">
              Choose Favorite Team
            </Link>,
          )}
        </section>

        <section className="home-player-section">
          <div className="section-heading">
            <h2>Your Favorite Players</h2>
            <p>Players saved from Search, Detail, or Onboarding.</p>
          </div>
          {renderPlayerGrid(
            favorites,
            SKELETON_COUNTS.favorites,
            "No favorite players yet.",
            <Link className="home-link secondary" to="/search">
              Search Players
            </Link>,
          )}
        </section>

        <section className="home-player-section">
          <div className="section-heading">
            <h2>Recommended For You</h2>
            <p>
              Recommended from your favorite team, current stats, and saved
              players.
            </p>
          </div>
          {renderPlayerGrid(
            recommendations,
            SKELETON_COUNTS.recommendations,
            "No recommendations yet.",
            <Link className="home-link secondary" to="/search">
              Find More Players
            </Link>,
          )}
        </section>
      </div>
    </div>
  );
}

export default HomePage;
