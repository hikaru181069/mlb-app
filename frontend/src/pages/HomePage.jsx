import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { getCurrentUser } from "../services/api/userApi";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import { isUnauthorizedError } from "../services/api/apiError";
import { getForYouRecommendations } from "../services/api/recommendationApi";
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

const JOURNEY_STEPS = [
  { num: "1", label: "Add Favorites" },
  { num: "2", label: "Get Matched"   },
  { num: "3", label: "Young Stars"   },
  { num: "4", label: "Prospects"     },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// ── 選手カード（横スクロール用） ───────────────────────────────────────────
function DiscoveryCard({ playerId, playerName, teamId, teamName, stat, statLabel, similarityPercentage, seedName }) {
  return (
    <div className="discovery-card-wrap">
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
          {similarityPercentage != null && (
            <span className="discovery-card-sim-badge">{similarityPercentage}%</span>
          )}
        </div>
        <p className="discovery-card-name">{playerName}</p>
        {stat && (
          <p className="discovery-card-stat">
            {stat} <span className="discovery-card-stat-label">{statLabel}</span>
          </p>
        )}
        {seedName && (
          <p className="discovery-card-reason">via {seedName}</p>
        )}
      </Link>
      <Link to={`/scout/${playerId}`} className="discovery-card-scout-link">
        Scout →
      </Link>
    </div>
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

// ── Because you like X グループ行 ──────────────────────────────────────────
function RecommendationGroup({ group }) {
  const lastName = group.seedPlayer.name.split(" ").slice(-1)[0];
  return (
    <div className="home-rec-group">
      <p className="home-rec-group-label">
        <img
          src={HEADSHOT_URL(group.seedPlayer.mlbPlayerId)}
          alt={group.seedPlayer.name}
          className="home-rec-seed-img"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        Because you like <strong>{lastName}</strong>
      </p>
      <div className="discovery-scroll">
        {group.matches.map((m) => (
          <DiscoveryCard
            key={m.mlbPlayerId}
            playerId={m.mlbPlayerId}
            playerName={m.name}
            teamName={m.team}
            similarityPercentage={m.similarityPercentage}
            seedName={lastName}
          />
        ))}
      </div>
    </div>
  );
}

// ── ホームページ ───────────────────────────────────────────────────────────
function HomePage() {
  const [user, setUser]             = useState(null);
  const [recData, setRecData]       = useState(null);
  const [risingHitters, setRisingHitters] = useState([]);
  const [risingPitchers, setRisingPitchers] = useState([]);
  const [loadingUser, setLoadingUser]   = useState(true);
  const [loadingRising, setLoadingRising] = useState(true);
  const [risingTab, setRisingTab]   = useState("hitters");

  const token = getAuthToken();

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) { setLoadingUser(false); return; }
      try {
        const currentUser = await getCurrentUser(token);
        setUser(currentUser);
        const recs = await getForYouRecommendations(token);
        setRecData(recs);
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
        {/* ヒーロー: 発見の流れを説明 */}
        <section className="guest-hero">
          <div className="guest-hero-text">
            <p className="home-kicker">MLB Player Discovery</p>
            <h1 className="guest-hero-title">Your Next Favorite<br />Player Is Already Here</h1>
            <p className="home-description">
              Add players you love. We&apos;ll automatically find similar players,
              rising stars, and prospects — like Spotify for MLB.
            </p>

            {/* 発見フロー可視化 */}
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
  const risingPlayers  = risingTab === "hitters" ? risingHitters : risingPitchers;
  const hasFavorites   = recData?.hasFavorites;
  const hasGroups      = (recData?.groups?.length ?? 0) > 0;

  return (
    <div className="home-discovery">
      {/* グリーティング */}
      <header className="home-discovery-header">
        <p className="home-greeting">
          {getGreeting()}{user?.name ? `, ${user.name}` : ""}
        </p>
      </header>

      {/* お気に入りなし → 発見のスタートCTA */}
      {!loadingUser && hasFavorites === false && (
        <section className="home-start">
          <div className="home-start-inner">
            <h2 className="home-start-title">Start Your Discovery</h2>
            <p className="home-start-desc">
              Add players you love. We&apos;ll automatically find similar players,
              young stars, and prospects.
            </p>
            <Link to="/onboarding/favorites" className="home-start-btn">
              Add Favorite Players
            </Link>
          </div>
        </section>
      )}

      {/* あなたへのおすすめ（お気に入りありの場合） */}
      {(loadingUser || hasFavorites !== false) && (
        <section className="discovery-section">
          <div className="discovery-section-header">
            <h2 className="discovery-section-title">Recommended For You</h2>
            <div className="discovery-section-header-row">
              <p className="discovery-section-desc">
                {hasGroups ? "Based on your favorites" : "Popular MLB players"}
              </p>
              <Link to="/foryou" className="discovery-see-all">See all →</Link>
            </div>
          </div>

          {loadingUser ? (
            <div className="discovery-scroll">
              {[...Array(3)].map((_, i) => <DiscoveryCardSkeleton key={i} />)}
            </div>
          ) : hasGroups ? (
            recData.groups.map((group) => (
              <RecommendationGroup key={group.seedPlayer.mlbPlayerId} group={group} />
            ))
          ) : (
            <div className="discovery-scroll">
              {(recData?.fallback ?? []).map((p) => (
                <DiscoveryCard
                  key={p.mlbPlayerId}
                  playerId={p.mlbPlayerId}
                  playerName={p.name}
                  teamName={p.team}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 若手スター */}
      <section className="discovery-section">
        <div className="discovery-section-header">
          <h2 className="discovery-section-title">Young Stars</h2>
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

      {/* プロスペクトへの導線 */}
      <section className="discovery-section">
        <div className="discovery-section-header">
          <h2 className="discovery-section-title">Discover Prospects</h2>
          <Link to="/prospects" className="discovery-see-all">See all →</Link>
        </div>
        <p className="discovery-section-desc" style={{ marginBottom: "12px" }}>
          AAA &amp; AA players on the verge of breaking through
        </p>
        <Link to="/prospects" className="home-prospects-banner">
          <span className="home-prospects-banner-text">Explore Minor League Prospects</span>
          <span className="home-prospects-banner-arrow">→</span>
        </Link>
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
