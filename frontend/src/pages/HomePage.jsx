import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { getCurrentUser } from "../services/api/userApi";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import { isUnauthorizedError } from "../services/api/apiError";

const MLB_LOGO = "https://www.mlbstatic.com/team-logos/league-on-dark/1.svg";

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

const JOURNEY_STEPS = [
  { num: "1", label: "Add Favorites"   },
  { num: "2", label: "Get Matched"     },
  { num: "3", label: "MLB Stats"        },
  { num: "4", label: "Prospects"       },
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

  // ─── ゲスト表示 ──────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="home-discovery">
        <section className="guest-hero">
          <div className="guest-hero-text">
            <p className="home-kicker">MLB Player Discovery</p>
            <h1 className="guest-hero-title">Your Next Favorite<br />Player Is Already Here</h1>
            <p className="home-description">
              Add players you love. We&apos;ll automatically find similar players,
              rising stars, and prospects — like Spotify for MLB.
            </p>

            <div className="guest-journey">
              {JOURNEY_STEPS.map((step, i) => (
                <div key={step.num} className="guest-journey-item">
                  <div className="guest-journey-step">
                    <span className="guest-journey-num">{step.num}</span>
                    <span className="guest-journey-label">{step.label}</span>
                  </div>
                  {i < JOURNEY_STEPS.length - 1 && (
                    <span className="guest-journey-arrow">→</span>
                  )}
                </div>
              ))}
            </div>

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

        <div className="home-tech-stack">
          {["MongoDB", "Express", "React", "Node.js", "MLB Stats API", "FastAPI"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    );
  }

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
