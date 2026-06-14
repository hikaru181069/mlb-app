import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { getCurrentUser } from "../services/api/userApi";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import { isUnauthorizedError } from "../services/api/apiError";
import { getRecommendations } from "../services/api/recommendationApi";
import { getRisingStars } from "../services/api/statsApi";

const MLB_LOGO = "https://www.mlbstatic.com/team-logos/league-on-dark/1.svg";

const HEADSHOT_URL = (id) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;

const ARCHETYPES = [
  { type: "power-hitter",   label: "Power Hitter",   color: "var(--ctp-red)"      },
  { type: "speedster",      label: "Speedster",       color: "var(--ctp-green)"    },
  { type: "contact-hitter", label: "Contact Hitter",  color: "var(--ctp-yellow)"   },
  { type: "ace",            label: "Ace",             color: "var(--ctp-mauve)"    },
  { type: "power-pitcher",  label: "Power Pitcher",   color: "var(--ctp-sapphire)" },
  { type: "workhorse",      label: "Workhorse",       color: "var(--ctp-teal)"     },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// ── 選手カード（横スクロール用） ───────────────────────────────────────────
function DiscoveryCard({ playerId, playerName, teamId, teamName, stat, statLabel }) {
  return (
    <Link to={`/players/${playerId}`} className="discovery-card">
      <div className="discovery-card-img-wrap">
        <img
          src={HEADSHOT_URL(playerId)}
          alt={playerName}
          className="discovery-card-img"
          onError={(e) => { e.currentTarget.style.opacity = "0.3"; }}
        />
        {teamId && (
          <img
            src={`https://www.mlbstatic.com/team-logos/${teamId}.svg`}
            alt={teamName}
            className="discovery-card-team-badge"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}
      </div>
      <p className="discovery-card-name">{playerName}</p>
      {stat && (
        <p className="discovery-card-stat">
          {stat} <span className="discovery-card-stat-label">{statLabel}</span>
        </p>
      )}
    </Link>
  );
}

function DiscoveryCardSkeleton() {
  return (
    <div className="discovery-card-skeleton">
      <div className="skeleton-block discovery-skeleton-img" />
      <div className="skeleton-block discovery-skeleton-name" />
      <div className="skeleton-block discovery-skeleton-stat" />
    </div>
  );
}

// ── ホームページ ───────────────────────────────────────────────────────────
function HomePage() {
  const [user, setUser]                   = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [risingHitters, setRisingHitters] = useState([]);
  const [risingPitchers, setRisingPitchers] = useState([]);
  const [loadingUser, setLoadingUser]     = useState(true);
  const [loadingRising, setLoadingRising] = useState(true);
  const [risingTab, setRisingTab]         = useState("hitters");

  const token = getAuthToken();

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) { setLoadingUser(false); return; }
      try {
        const currentUser = await getCurrentUser(token);
        setUser(currentUser);

        const recs = await getRecommendations(token);
        setRecommendations(recs ?? []);
      } catch (err) {
        if (isUnauthorizedError(err)) clearAuthData();
      } finally {
        setLoadingUser(false);
      }
    };

    const fetchRising = async () => {
      try {
        const data = await getRisingStars();
        setRisingHitters(data.hitters ?? []);
        setRisingPitchers(data.pitchers ?? []);
      } catch {
        // silent fail
      } finally {
        setLoadingRising(false);
      }
    };

    fetchUser();
    fetchRising();
  }, [token]);

  // ─── ゲスト表示 ──────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="home-discovery">
        <section className="guest-hero">
          <div className="guest-hero-text">
            <p className="home-kicker">MLB Player Discovery</p>
            <h1 className="guest-hero-title">Find Your Next<br />Favorite Player</h1>
            <p className="home-description">
              Discover MLB players by playing style, age, and league.
              Get personalized picks powered by real stats.
            </p>
            <div className="home-actions">
              <Link className="home-link" to="/register">Get Started</Link>
              <Link className="home-link secondary" to="/login">Login</Link>
            </div>
          </div>
          <div className="guest-hero-visual" aria-hidden="true">
            <img src={MLB_LOGO} alt="" className="guest-hero-logo" />
          </div>
        </section>

        <section className="discovery-section">
          <div className="discovery-section-header">
            <h2 className="discovery-section-title">Browse by Style</h2>
            <p className="discovery-section-desc">Explore players by playing style</p>
          </div>
          <div className="discovery-archetypes">
            {ARCHETYPES.map((a) => (
              <Link
                key={a.type}
                to={`/archetype/${a.type}`}
                className="discovery-archetype-chip"
                style={{ "--chip-color": a.color }}
              >
                {a.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="home-tech-stack">
          {["MongoDB", "Express", "React", "Node.js", "MLB Stats API", "FastAPI"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    );
  }

  // ─── ログイン済み表示 ─────────────────────────────────────────────────────
  const risingPlayers = risingTab === "hitters" ? risingHitters : risingPitchers;

  return (
    <div className="home-discovery">
      {/* グリーティング */}
      <header className="home-discovery-header">
        <p className="home-greeting">
          {getGreeting()}{user?.name ? `, ${user.name}` : ""}
        </p>
      </header>

      {/* 発見CTA */}
      <section className="discovery-cta">
        <p className="discovery-cta-label">Player Discovery</p>
        <h2 className="discovery-cta-title">Find Your Next Favorite Player</h2>
        <p className="discovery-cta-desc">
          Answer 3 questions and we&apos;ll find players you&apos;ll love.
        </p>
        <div className="discovery-cta-buttons">
          <Link to="/recommendations" className="discovery-cta-btn">
            Hitters
          </Link>
          <Link to="/recommendations" className="discovery-cta-btn secondary">
            Pitchers
          </Link>
        </div>
      </section>

      {/* あなたへのおすすめ */}
      {(loadingUser || recommendations.length > 0) && (
        <section className="discovery-section">
          <div className="discovery-section-header">
            <h2 className="discovery-section-title">Recommended For You</h2>
            <p className="discovery-section-desc">
              {user?.favoriteTeam?.name
                ? `Based on your favorite team — ${user.favoriteTeam.name}`
                : "Based on your profile"}
            </p>
          </div>
          <div className="discovery-scroll">
            {loadingUser
              ? [...Array(3)].map((_, i) => <DiscoveryCardSkeleton key={i} />)
              : recommendations.map((p) => (
                  <DiscoveryCard
                    key={p.mlbPlayerId}
                    playerId={p.mlbPlayerId}
                    playerName={p.name}
                    teamId={p.teamId}
                    teamName={p.team}
                  />
                ))}
          </div>
        </section>
      )}

      {/* Rising Stars */}
      <section className="discovery-section">
        <div className="discovery-section-header">
          <h2 className="discovery-section-title">Rising Stars</h2>
          <p className="discovery-section-desc">25 and under, turning heads this season</p>
        </div>
        <div className="discovery-tab-bar">
          <button
            className={`discovery-tab${risingTab === "hitters" ? " active" : ""}`}
            onClick={() => setRisingTab("hitters")}
          >
            Hitters
          </button>
          <button
            className={`discovery-tab${risingTab === "pitchers" ? " active" : ""}`}
            onClick={() => setRisingTab("pitchers")}
          >
            Pitchers
          </button>
        </div>
        <div className="discovery-scroll">
          {loadingRising
            ? [...Array(5)].map((_, i) => <DiscoveryCardSkeleton key={i} />)
            : risingPlayers.map((p) => (
                <DiscoveryCard
                  key={p.playerId}
                  playerId={p.playerId}
                  playerName={p.playerName}
                  teamId={p.teamId}
                  teamName={p.teamName}
                  stat={p.stat}
                  statLabel={p.statLabel}
                />
              ))}
        </div>
      </section>

      {/* プレースタイル別に探す */}
      <section className="discovery-section">
        <div className="discovery-section-header">
          <h2 className="discovery-section-title">Browse by Style</h2>
          <p className="discovery-section-desc">Explore players by playing style</p>
        </div>
        <div className="discovery-archetypes">
          {ARCHETYPES.map((a) => (
            <Link
              key={a.type}
              to={`/archetype/${a.type}`}
              className="discovery-archetype-chip"
              style={{ "--chip-color": a.color }}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
