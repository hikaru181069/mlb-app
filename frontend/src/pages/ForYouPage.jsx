import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sparkles, Star } from "lucide-react";
import { getAuthToken } from "../utils/authStorage";
import { getForYouRecommendations } from "../services/api/recommendationApi";

const HEADSHOT_URL = (id) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;

const HITTER_STATS = [
  { key: "ops",         label: "OPS",  fmt: (v) => v?.toFixed(3) ?? "-" },
  { key: "homeRuns",    label: "HR",   fmt: (v) => v ?? "-" },
  { key: "stolenBases", label: "SB",   fmt: (v) => v ?? "-" },
];

const PITCHER_STATS = [
  { key: "era",        label: "ERA", fmt: (v) => v?.toFixed(2) ?? "-" },
  { key: "strikeouts", label: "K",   fmt: (v) => v ?? "-" },
  { key: "wins",       label: "W",   fmt: (v) => v ?? "-" },
];

// ── スタット比較テーブル ────────────────────────────────────────────────────
function StatComparison({ seedName, seedStats, matchStats, playerType }) {
  const rows = playerType === "pitcher" ? PITCHER_STATS : HITTER_STATS;
  const seedLabel = seedName.split(" ").slice(-1)[0];

  return (
    <div className="foryou-stat-comparison">
      <div className="foryou-stat-header">
        <span />
        <span className="foryou-stat-col-label foryou-stat-col-match">This player</span>
        <span className="foryou-stat-col-label foryou-stat-col-seed">{seedLabel}</span>
      </div>
      {rows.map(({ key, label, fmt }) => (
        <div key={key} className="foryou-stat-row">
          <span className="foryou-stat-key">{label}</span>
          <span className="foryou-stat-val foryou-stat-col-match">{fmt(matchStats?.[key])}</span>
          <span className="foryou-stat-val foryou-stat-col-seed">{fmt(seedStats?.[key])}</span>
        </div>
      ))}
    </div>
  );
}

// ── 推薦カード ─────────────────────────────────────────────────────────────
function ForYouCard({ match, seedPlayer }) {
  return (
    <div className="foryou-card">
      <div className="foryou-card-top">
        <Link to={`/players/${match.mlbPlayerId}`} className="foryou-card-player-link">
          <img
            src={HEADSHOT_URL(match.mlbPlayerId)}
            alt={match.name}
            className="foryou-card-img"
            onError={(e) => { e.currentTarget.style.opacity = "0.4"; }}
          />
          <div className="foryou-card-info">
            <p className="foryou-card-name">{match.name}</p>
            <p className="foryou-card-meta">
              {match.position} · {match.team}
              {match.age ? ` · Age ${match.age}` : ""}
            </p>
          </div>
        </Link>
        <span className="foryou-sim-badge">{match.similarityPercentage}%</span>
      </div>

      <StatComparison
        seedName={seedPlayer.name}
        seedStats={seedPlayer.keyStats}
        matchStats={match.keyStats}
        playerType={match.playerType}
      />

      <Link to={`/scout/${match.mlbPlayerId}`} className="foryou-scout-btn">
        Scouting Report →
      </Link>
    </div>
  );
}

// ── お気に入り起点グループ ───────────────────────────────────────────────────
function SeedGroup({ group }) {
  return (
    <section className="foryou-group">
      <div className="foryou-group-header">
        <img
          src={HEADSHOT_URL(group.seedPlayer.mlbPlayerId)}
          alt={group.seedPlayer.name}
          className="foryou-seed-img"
          onError={(e) => { e.currentTarget.style.opacity = "0.4"; }}
        />
        <div>
          <p className="foryou-group-because">Because you like</p>
          <p className="foryou-group-name">{group.seedPlayer.name}</p>
        </div>
      </div>

      <div className="foryou-cards">
        {group.matches.map((match) => (
          <ForYouCard key={match.mlbPlayerId} match={match} seedPlayer={group.seedPlayer} />
        ))}
      </div>
    </section>
  );
}

// ── スケルトン ──────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="foryou-page">
      <header className="foryou-header">
        <div className="skeleton-block" style={{ width: 120, height: 28, borderRadius: 6 }} />
        <div className="skeleton-block" style={{ width: 220, height: 16, borderRadius: 4, marginTop: 8 }} />
      </header>
      {[0, 1].map((i) => (
        <div key={i} className="foryou-group">
          <div className="skeleton-block" style={{ width: 200, height: 40, borderRadius: 8, marginBottom: 16 }} />
          <div className="foryou-cards">
            {[0, 1].map((j) => (
              <div key={j} className="skeleton-block" style={{ flex: 1, minWidth: 260, height: 180, borderRadius: 12 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── For You ページ ──────────────────────────────────────────────────────────
function ForYouPage() {
  const token = getAuthToken();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getForYouRecommendations(token)
      .then(setData)
      .catch(() => setData({ groups: [], fallback: [] }))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <div className="foryou-page">
        <div className="foryou-empty">
          <Sparkles size={40} strokeWidth={1.5} className="foryou-empty-icon" />
          <p className="foryou-empty-title">Personalized picks, just for you</p>
          <p className="foryou-empty-desc">
            Add players to your Favorites and we&apos;ll find similar players across the league.
          </p>
          <Link to="/login" className="foryou-login-btn">Login to get started</Link>
        </div>
      </div>
    );
  }

  if (loading) return <Skeleton />;

  const groups   = data?.groups   ?? [];
  const fallback = data?.fallback ?? [];

  return (
    <div className="foryou-page">
      <header className="foryou-header">
        <h1 className="foryou-title">For You</h1>
        <p className="foryou-subtitle">
          {groups.length > 0
            ? "Players who play like your favorites — ranked by similarity"
            : "Add favorites to get personalized picks"}
        </p>
      </header>

      {groups.map((group) => (
        <SeedGroup key={group.seedPlayer.mlbPlayerId} group={group} />
      ))}

      {groups.length === 0 && fallback.length > 0 && (
        <section className="foryou-group">
          <div className="foryou-group-header foryou-group-header--fallback">
            <p className="foryou-group-name">Popular Players</p>
          </div>
          <div className="foryou-cards">
            {fallback.map((p) => (
              <div key={p.mlbPlayerId} className="foryou-card foryou-card--simple">
                <Link to={`/players/${p.mlbPlayerId}`} className="foryou-card-player-link">
                  <img
                    src={HEADSHOT_URL(p.mlbPlayerId)}
                    alt={p.name}
                    className="foryou-card-img"
                    onError={(e) => { e.currentTarget.style.opacity = "0.4"; }}
                  />
                  <div className="foryou-card-info">
                    <p className="foryou-card-name">{p.name}</p>
                    <p className="foryou-card-meta">{p.team}</p>
                  </div>
                </Link>
                <Link to={`/scout/${p.mlbPlayerId}`} className="foryou-scout-btn">
                  Scouting Report →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {groups.length === 0 && fallback.length === 0 && (
        <div className="foryou-empty">
          <Star size={40} strokeWidth={1.5} className="foryou-empty-icon" />
          <p className="foryou-empty-title">Add players to get recommendations</p>
          <p className="foryou-empty-desc">
            Favorite a few MLB players and we&apos;ll find others who match their style.
          </p>
          <Link to="/favorites" className="foryou-login-btn">Go to Favorites</Link>
          <p className="foryou-empty-hint">
            Not sure who to add?{" "}
            <Link to="/recommendations" className="foryou-empty-quiz-link">Try the Discovery Quiz →</Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default ForYouPage;
