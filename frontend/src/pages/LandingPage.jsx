import { Link, Navigate } from "react-router-dom";
import { getAuthToken } from "../utils/authStorage";

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
  { num: "1", label: "Add Favorites" },
  { num: "2", label: "Get Matched"   },
  { num: "3", label: "MLB Stats"     },
  { num: "4", label: "Prospects"     },
];

function LandingPage() {
  const token = getAuthToken();
  if (token) return <Navigate to="/" replace />;

  return (
    <div className="landing-page">

      {/* ミニナビ */}
      <nav className="landing-nav">
        <img src={MLB_LOGO} alt="MLB" className="landing-nav-logo" />
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-nav-login">Login</Link>
          <Link to="/register" className="home-link">Get Started</Link>
        </div>
      </nav>

      <div className="landing-body">

        {/* ヒーロー */}
        <section className="guest-hero">
          <img src={MLB_LOGO} alt="MLB" className="guest-hero-logo" />
          <p className="home-kicker">MLB Player Discovery</p>
          <h1 className="guest-hero-title">Find Players You&apos;ll Love</h1>
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
        </section>

        {/* 機能タイル */}
        <section className="guest-features">
          <h2 className="guest-features-title">Everything in one place</h2>
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
        </section>

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
    </div>
  );
}

export default LandingPage;
