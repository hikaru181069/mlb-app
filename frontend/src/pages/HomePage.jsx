import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { getCurrentUser } from "../services/api/userApi";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import { isUnauthorizedError } from "../services/api/apiError";

const ARCHETYPES = [
  { type: "power-hitter",   label: "Power Hitter",   color: "var(--ctp-red)"      },
  { type: "speedster",      label: "Speedster",       color: "var(--ctp-green)"    },
  { type: "contact-hitter", label: "Contact Hitter",  color: "var(--ctp-yellow)"   },
  { type: "ace",            label: "Ace",             color: "var(--ctp-mauve)"    },
  { type: "power-pitcher",  label: "Power Pitcher",   color: "var(--ctp-sapphire)" },
  { type: "workhorse",      label: "Workhorse",       color: "var(--ctp-teal)"     },
];

const TILES = [
  {
    to:    "/foryou",
    title: "For You",
    desc:  "Players who play like your favorites",
    color: "var(--ctp-sapphire)",
    cta:   "View picks →",
  },
  {
    to:    "/recommendations",
    title: "Discovery Quiz",
    desc:  "Answer 3 questions to find your next favorite player",
    color: "var(--ctp-lavender)",
    cta:   "Start quiz →",
  },
  {
    to:    "/compare",
    title: "Compare",
    desc:  "Head-to-head stats for any two MLB players",
    color: "var(--ctp-blue)",
    cta:   "Compare players →",
  },
  {
    to:    "/matchup",
    title: "Matchup",
    desc:  "Pitcher vs batter — career stats and AI prediction",
    color: "var(--ctp-red)",
    cta:   "Simulate →",
  },
  {
    to:    "/prospects",
    title: "Prospects",
    desc:  "AAA & AA players on the verge of breaking through",
    color: "var(--ctp-green)",
    cta:   "Explore →",
  },
  {
    to:    "/stats",
    title: "MLB Stats",
    desc:  "League leaders in hitting and pitching this season",
    color: "var(--ctp-peach)",
    cta:   "View Leaders →",
  },
  {
    to:    "/search",
    title: "Scouting",
    desc:  "Deep-dive any MLB player's stats and analytics",
    color: "var(--ctp-mauve)",
    cta:   "Find a player →",
  },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// ── ホームページ ───────────────────────────────────────────────────────────
function HomePage() {
  const [user, setUser] = useState(null);
  const token = getAuthToken();

  useEffect(() => {
    if (!token) return;
    getCurrentUser(token)
      .then(setUser)
      .catch((err) => { if (isUnauthorizedError(err)) clearAuthData(); });
  }, [token]);

  // 未ログインはランディングページへ
  if (!token) return <Navigate to="/landing" replace />;

  // ─── ログイン済み表示 ─────────────────────────────────────────────────────
  return (
    <div className="home-discovery">
      <header className="home-discovery-header">
        <p className="home-greeting">
          {getGreeting()}{user?.name ? `, ${user.name}` : ""}
        </p>
      </header>

      {/* 機能タイル */}
      <div className="home-tiles">
        {TILES.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="home-tile"
            style={{ "--tile-color": tile.color }}
          >
            <h3 className="home-tile-title">{tile.title}</h3>
            <p className="home-tile-desc">{tile.desc}</p>
            <span className="home-tile-cta">{tile.cta}</span>
          </Link>
        ))}
      </div>

      {/* プレースタイル別に探す */}
      <section className="discovery-section">
        <div className="discovery-section-header">
          <div className="discovery-section-title-row">
            <h2 className="discovery-section-title">Browse by Style</h2>
            <Link to="/positions" className="discovery-see-all">Browse by Position →</Link>
          </div>
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
