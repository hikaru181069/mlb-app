import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PlayerCard from "../components/PlayerCard";
import SkeletonCard from "../components/SkeletonCard";
import { getExternalPlayersByTeam } from "../services/api/externalPlayerApi";
import { getCurrentUser } from "../services/api/userApi";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import {
  getApiErrorMessage,
  isUnauthorizedError,
} from "../services/api/apiError";

const SKELETON_COUNT = 12;

function RosterSection({ title, players, loading, skeletonCount }) {
  if (loading) {
    return (
      <section className="home-player-section">
        <div className="section-heading-row">
          <div className="section-heading">
            <h2>{title}</h2>
          </div>
        </div>
        <div className="player-list">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (players.length === 0) return null;

  return (
    <section className="home-player-section">
      <div className="section-heading-row">
        <div className="section-heading">
          <h2>
            {title}
            <span className="count-badge">{players.length}</span>
          </h2>
        </div>
      </div>
      <div className="player-list">
        {players.map((player) => (
          <PlayerCard
            key={player.playerId || player.mlbPlayerId || player.externalId}
            player={player}
          />
        ))}
      </div>
    </section>
  );
}

function TeamRosterPage() {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const token = getAuthToken();

  useEffect(() => {
    const fetchTeamRoster = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setErrorMessage("");

        const currentUser = await getCurrentUser(token);
        setUser(currentUser);

        if (currentUser.favoriteTeam?.id) {
          const teamPlayers = await getExternalPlayersByTeam(
            currentUser.favoriteTeam.id,
          );
          setPlayers(teamPlayers);
        }
      } catch (error) {
        console.error("Team roster fetch error:", error);
        if (isUnauthorizedError(error)) {
          clearAuthData();
          setErrorMessage("Your login session expired. Please login again.");
          return;
        }
        setErrorMessage(
          getApiErrorMessage(error, "Failed to load team roster."),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTeamRoster();
  }, [token]);

  const { pitchers, positionPlayers } = useMemo(() => {
    return {
      pitchers: players.filter((p) => p.playerType === "pitcher"),
      positionPlayers: players.filter((p) => p.playerType !== "pitcher"),
    };
  }, [players]);

  if (!token) {
    return (
      <div className="home-page px-6 py-12">
        <div className="home-empty-state">
          <span className="empty-state-icon">🔒</span>
          <p className="empty-state-title">Login required</p>
          <p className="empty-state-desc">
            Please login to view your favorite team's roster.
          </p>
          <Link className="home-link secondary" to="/login">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page px-6 py-12">
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">Team Roster</p>
        <div className="flex items-center justify-center gap-3">
          {user?.favoriteTeam?.id && (
            <img
              src={`https://www.mlbstatic.com/team-logos/${user.favoriteTeam.id}.svg`}
              alt={user.favoriteTeam.name}
              style={{ width: "48px", height: "48px" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {user?.favoriteTeam?.name ?? "Your Team"}
          </h1>
          {!loading && players.length > 0 && (
            <span className="count-badge">{players.length}</span>
          )}
        </div>
        <p className="home-description mt-4 text-base">
          Full roster from the MLB Stats API.
        </p>
        <div className="home-actions mt-6">
          <Link className="home-link secondary" to="/">
            ← Back to Home
          </Link>
          <Link className="home-link secondary" to="/onboarding/team">
            Change Team
          </Link>
        </div>
      </section>

      <div className="home-content mt-2 w-full">
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {!loading && !errorMessage && !user?.favoriteTeam?.id && (
          <div className="home-empty-state">
            <span className="empty-state-icon">⚾</span>
            <p className="empty-state-title">No favorite team set</p>
            <p className="empty-state-desc">
              Choose a favorite team to see its full roster here.
            </p>
            <Link className="home-link secondary" to="/onboarding/team">
              Choose Team
            </Link>
          </div>
        )}

        <RosterSection
          title="Pitchers"
          players={pitchers}
          loading={loading}
          skeletonCount={Math.ceil(SKELETON_COUNT / 2)}
        />

        <RosterSection
          title="Position Players"
          players={positionPlayers}
          loading={loading}
          skeletonCount={Math.ceil(SKELETON_COUNT / 2)}
        />
      </div>
    </div>
  );
}

export default TeamRosterPage;
