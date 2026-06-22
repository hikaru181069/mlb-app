import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAuthToken } from "../utils/authStorage";
import { getProspectRecommendations } from "../services/api/recommendationApi";

const HEADSHOT_URL = (id) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;

function ProspectCard({ prospect, showSim }) {
  const {
    playerId, fullName, level, team, parentOrg, parentOrgId,
    age, position, ops, homeRuns, stolenBases, era, strikeouts, wins,
    similarityPercentage, reason,
  } = prospect;

  const isPitcher = era > 0 && ops === 0;

  return (
    <Link to={`/players/${playerId}`} className="prospect-card">
      <div className="prospect-card-headshot">
        <img
          src={HEADSHOT_URL(playerId)}
          alt={fullName}
          className="prospect-card-img"
          onError={(e) => { e.currentTarget.style.opacity = "0.3"; }}
        />
        {parentOrgId && (
          <img
            src={`https://www.mlbstatic.com/team-logos/${parentOrgId}.svg`}
            alt={parentOrg}
            className="prospect-card-org-badge"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}
      </div>

      <div className="prospect-card-body">
        <div className="prospect-card-meta">
          <span className="prospect-card-level">{level}</span>
          {age > 0 && <span className="prospect-card-age">Age {age}</span>}
          {position && <span className="prospect-card-pos">{position}</span>}
        </div>

        <p className="prospect-card-name">{fullName}</p>
        <p className="prospect-card-team">{team}</p>
        {parentOrg && <p className="prospect-card-org">{parentOrg} prospect</p>}

        <div className="prospect-card-stats">
          {isPitcher ? (
            <>
              {era > 0 && (
                <span className="prospect-stat">
                  <span className="prospect-stat-val">{era.toFixed(2)}</span>
                  <span className="prospect-stat-label">ERA</span>
                </span>
              )}
              {strikeouts > 0 && (
                <span className="prospect-stat">
                  <span className="prospect-stat-val">{strikeouts}</span>
                  <span className="prospect-stat-label">K</span>
                </span>
              )}
              {wins > 0 && (
                <span className="prospect-stat">
                  <span className="prospect-stat-val">{wins}</span>
                  <span className="prospect-stat-label">W</span>
                </span>
              )}
            </>
          ) : (
            <>
              {ops > 0 && (
                <span className="prospect-stat">
                  <span className="prospect-stat-val">{ops.toFixed(3)}</span>
                  <span className="prospect-stat-label">OPS</span>
                </span>
              )}
              {homeRuns > 0 && (
                <span className="prospect-stat">
                  <span className="prospect-stat-val">{homeRuns}</span>
                  <span className="prospect-stat-label">HR</span>
                </span>
              )}
              {stolenBases > 0 && (
                <span className="prospect-stat">
                  <span className="prospect-stat-val">{stolenBases}</span>
                  <span className="prospect-stat-label">SB</span>
                </span>
              )}
            </>
          )}
        </div>

        {reason && <p className="prospect-card-reason">{reason}</p>}
      </div>

      {showSim && similarityPercentage != null && (
        <div className="prospect-card-sim">
          <span className="prospect-sim-pct">{similarityPercentage}%</span>
          <span className="prospect-sim-label">match</span>
        </div>
      )}
    </Link>
  );
}

function SkeletonProspectCard() {
  return (
    <div className="prospect-card prospect-card--skeleton">
      <div className="prospect-card-headshot skeleton-block" style={{ borderRadius: "50%", width: 64, height: 64, flexShrink: 0 }} />
      <div className="prospect-card-body">
        <div className="skeleton-block" style={{ width: 60, height: 14, borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton-block" style={{ width: 130, height: 18, borderRadius: 4, marginBottom: 4 }} />
        <div className="skeleton-block" style={{ width: 90, height: 14, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function ProspectSection({ title, prospects, showSim, loading }) {
  return (
    <div className="prospect-section">
      <h2 className="prospect-section-title">{title}</h2>
      {loading ? (
        <div className="prospect-list">
          {Array.from({ length: 4 }, (_, i) => <SkeletonProspectCard key={i} />)}
        </div>
      ) : prospects.length === 0 ? (
        <p className="prospect-section-empty">No prospects available.</p>
      ) : (
        <div className="prospect-list">
          {prospects.map((p) => (
            <ProspectCard key={p.playerId} prospect={p} showSim={showSim} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProspectsPage() {
  const token = getAuthToken();
  const [hitters, setHitters]   = useState([]);
  const [pitchers, setPitchers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getProspectRecommendations(token)
      .then(({ hitters: h, pitchers: p }) => {
        setHitters(h || []);
        setPitchers(p || []);
      })
      .catch((err) => setError(err.message || "Failed to load prospects."))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <div className="home-page px-6 py-16">
        <div className="home-empty-state">
          <p className="empty-state-title">Login to see prospects</p>
          <p className="empty-state-desc">We match minor league prospects to your favorite players.</p>
          <div className="home-actions">
            <Link className="home-link" to="/login">Login</Link>
            <Link className="home-link secondary" to="/register">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  const hasHitterFavs  = hitters.some((p) => p.similarityPercentage != null);
  const hasPitcherFavs = pitchers.some((p) => p.similarityPercentage != null);

  return (
    <div className="home-page px-6 py-10">
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">Minor Leagues</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          Prospects to Watch
        </h1>
        <p className="home-description mt-4 text-base">
          AAA and AA players to keep an eye on this season.
        </p>
      </section>

      <div className="home-content mt-2 w-full">
        {error && <p className="error-message">{error}</p>}

        <div className="prospects-columns">
          <ProspectSection
            title="Hitters"
            prospects={hitters}
            showSim={hasHitterFavs}
            loading={loading}
          />
          <ProspectSection
            title="Pitchers"
            prospects={pitchers}
            showSim={hasPitcherFavs}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default ProspectsPage;
