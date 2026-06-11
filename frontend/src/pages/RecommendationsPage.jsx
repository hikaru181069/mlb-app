import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bot, Sparkles, Star } from "lucide-react";

import PageHeader from "../components/PageHeader";
import {
  getFutureStars,
  getRecommendations,
} from "../services/api/recommendationApi";
import {
  getApiErrorMessage,
  isUnauthorizedError,
} from "../services/api/apiError";
import { clearAuthData, getAuthToken } from "../utils/authStorage";

// アーキタイプ名 → カラー
const ARCHETYPE_COLORS = {
  "Power Hitter":    "var(--ctp-red)",
  "Speedster":       "var(--ctp-teal)",
  "Contact Hitter":  "var(--ctp-green)",
  "Five-Tool Threat":"var(--ctp-yellow)",
  "Ace":             "var(--ctp-mauve)",
  "Power Pitcher":   "var(--ctp-maroon)",
  "Control Artist":  "var(--ctp-sapphire)",
  "Workhorse":       "var(--ctp-peach)",
};

// styleScores の各軸 → 表示ラベルとカラー
// 野手・投手それぞれ3軸を定義
const HITTER_TRAITS = [
  { key: "power",   label: "Power",   color: "var(--ctp-red)"      },
  { key: "speed",   label: "Speed",   color: "var(--ctp-teal)"     },
  { key: "contact", label: "Contact", color: "var(--ctp-green)"    },
];
const PITCHER_TRAITS = [
  { key: "dominance",  label: "Dominance",  color: "var(--ctp-mauve)"    },
  { key: "control",    label: "Control",    color: "var(--ctp-sapphire)" },
  { key: "durability", label: "Durability", color: "var(--ctp-peach)"    },
];

// playerType に応じた3軸を常にスコア順で返す（0でも表示）
const getStyleTraits = (styleScores, playerType) => {
  if (!styleScores) return [];
  const defs = playerType === "pitcher" ? PITCHER_TRAITS : HITTER_TRAITS;
  return defs
    .map((def) => ({ ...def, score: styleScores[def.key] ?? 0 }))
    .sort((a, b) => b.score - a.score);
};

const archetypeSlug = (name) => name?.toLowerCase().replace(/\s+/g, "-") ?? "";

// "Recommended from your favorite team" は reason に表示するので reasons タグからは除く
const GENERIC_REASONS = new Set([
  "Recommended from your favorite team",
  "Has current season stats",
  "Active roster player",
]);

function RecommendedPlayerCard({ player }) {
  const isAllAround = player.archetype === "All-Around";
  const color = ARCHETYPE_COLORS[player.archetype];
  const slug  = archetypeSlug(player.archetype);
  const styleTraits = isAllAround ? getStyleTraits(player.styleScores, player.playerType) : [];

  const tagReasons = (player.recommendationReasons || []).filter(
    (r) => !GENERIC_REASONS.has(r),
  );

  const h = player.hitterStats  || player.currentSeasonStats?.hitterStats;
  const p = player.pitcherStats || player.currentSeasonStats?.pitcherStats;

  return (
    <article className="rec-player-card">
      {/* ── 左: 顔写真 ── */}
      {player.image && (
        <Link to={`/players/${player.playerId}`} className="rec-player-img-wrap">
          <img src={player.image} alt={player.fullName} className="rec-player-img" />
        </Link>
      )}

      {/* ── 右: 情報 ── */}
      <div className="rec-player-body">
        {/* 名前 + アーキタイプ or スタイルトレイト */}
        <div className="rec-player-header">
          <Link to={`/players/${player.playerId}`} className="rec-player-name">
            {player.fullName}
          </Link>
          {/* All-Around → スタイルトレイトタグを表示 */}
          {isAllAround && styleTraits.map(({ key, label, color: c }) => (
            <span key={key} className="rec-style-trait" style={{ background: c }}>
              {label}
            </span>
          ))}
          {/* その他 → アーキタイプバッジ */}
          {!isAllAround && player.archetype && (
            <Link
              to={`/archetype/${slug}`}
              className="rec-archetype-badge"
              style={{ background: color }}
            >
              {player.archetype}
            </Link>
          )}
        </div>

        {/* チーム + ポジション */}
        <p className="rec-player-meta">{player.team} · {player.position}</p>

        {/* スタッツ */}
        {player.playerType === "hitter" && h && (
          <div className="rec-player-stats">
            <span>.{String(Math.round((parseFloat(h.battingAverage || h.avg || 0)) * 1000)).padStart(3, "0")} AVG</span>
            <span>{h.homeRuns ?? "—"} HR</span>
            <span>{h.rbis ?? h.rbi ?? "—"} RBI</span>
            <span>{h.ops ? parseFloat(h.ops).toFixed(3) : "—"} OPS</span>
          </div>
        )}
        {player.playerType === "pitcher" && p && (
          <div className="rec-player-stats">
            <span>{p.era ?? "—"} ERA</span>
            <span>{p.strikeouts ?? "—"} K</span>
            <span>{p.inningsPitched ?? "—"} IP</span>
          </div>
        )}

        {/* Why recommended */}
        {player.reason && (
          <p className="rec-player-reason">
            <span className="rec-reason-label">Why:</span> {player.reason}
          </p>
        )}

        {/* 特徴タグ */}
        {tagReasons.length > 0 && (
          <div className="rec-player-tags">
            {tagReasons.map((r) => (
              <span key={r} className="rec-reason-badge">{r}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function FutureStarCard({ player }) {
  return (
    <article className="future-star-card">
      <div className="future-star-card-top">
        <span className="future-star-badge">
          <Sparkles size={14} strokeWidth={2} />
          Rising Star
        </span>
        <span className="future-star-score">
          {player.similarityPercentage}% match
        </span>
      </div>

      <h3>{player.fullName}</h3>
      <p className="future-star-org">
        {player.organization}{player.position ? ` · ${player.position}` : ""}
      </p>

      <dl className="future-star-meta">
        <div>
          <dt>Age</dt>
          <dd>{player.age}</dd>
        </div>
        <div>
          <dt>OPS</dt>
          <dd>{player.stats?.ops?.toFixed?.(3) ?? "-"}</dd>
        </div>
        <div>
          <dt>HR</dt>
          <dd>{player.stats?.homeRuns ?? "-"}</dd>
        </div>
        <div>
          <dt>AVG</dt>
          <dd>{player.stats?.avg?.toFixed?.(3) ?? "-"}</dd>
        </div>
      </dl>

      {player.reasons?.length > 0 && (
        <div className="future-star-reasons">
          {player.reasons.slice(0, 4).map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      )}
    </article>
  );
}

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [futureStars, setFutureStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const token = getAuthToken();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [regularResult, futureStarsResult] = await Promise.allSettled([
          getRecommendations(token),
          getFutureStars(token),
        ]);

        if (!active) return;

        if (regularResult.status === "fulfilled") {
          setRecommendations(regularResult.value);
        }

        if (futureStarsResult.status === "fulfilled") {
          setFutureStars(futureStarsResult.value);
        }

        if (
          regularResult.status === "rejected" &&
          futureStarsResult.status === "rejected"
        ) {
          throw regularResult.reason;
        }
      } catch (error) {
        if (!active) return;
        console.error("Recommendations page error:", error);

        if (isUnauthorizedError(error)) {
          clearAuthData();
          setErrorMessage("Your login session expired. Please login again.");
          return;
        }

        setErrorMessage(
          getApiErrorMessage(error, "Failed to load recommendations."),
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="app-screen">
        <PageHeader
          kicker="Personalized"
          title="Recommendations"
          subtitle="Login to see players matched to your favorites."
        />
        <div className="screen-body px-6 py-6 w-full">
          <div className="tool-placeholder">
            <p>Login to view personalized recommendations.</p>
          </div>
          <div className="home-actions mt-6">
            <Link className="home-link" to="/login">
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <PageHeader
        accentColor="var(--ctp-teal)"
        backTo="/"
        backLabel="Home"
        kicker="Personalized"
        title="Recommendations"
        subtitle="Discover MLB players and Future Stars based on your favorites."
      />

      <div className="screen-body recommendations-page px-6 py-6 w-full">
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <section className="recommendation-section">
          <div className="section-heading-row">
            <div className="section-heading">
              <h2>
                MLB Picks
                {recommendations.length > 0 && (
                  <span className="count-badge">{recommendations.length}</span>
                )}
              </h2>
              <p>Current MLB players selected from your team and saved players.</p>
            </div>
            <Bot className="recommendation-section-icon" size={24} />
          </div>

          {loading ? (
            <div className="rec-player-list">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="rec-player-card rec-player-card--loading">
                  <div className="rec-player-img-wrap skeleton-block" />
                  <div className="rec-player-body">
                    <div className="skeleton-block" style={{ height: 16, width: "60%", borderRadius: 6 }} />
                    <div className="skeleton-block" style={{ height: 12, width: "40%", borderRadius: 6, marginTop: 8 }} />
                    <div className="skeleton-block" style={{ height: 12, width: "80%", borderRadius: 6, marginTop: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="rec-player-list">
              {recommendations.map((player) => (
                <RecommendedPlayerCard
                  key={player.playerId || player.mlbPlayerId}
                  player={player}
                />
              ))}
            </div>
          ) : (
            <div className="tool-placeholder">
              <p>Save favorite players to unlock MLB recommendations.</p>
            </div>
          )}
        </section>

        <section className="recommendation-section future-stars-section">
          <div className="section-heading-row">
            <div className="section-heading">
              <h2>
                Rising Stars
                {futureStars.length > 0 && (
                  <span className="count-badge">{futureStars.length}</span>
                )}
              </h2>
              <p>Young MLB players (age 25 and under) who match your play style preferences.</p>
            </div>
            <Star className="recommendation-section-icon" size={24} />
          </div>

          {loading ? (
            <div className="future-stars-grid">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="future-star-card future-star-card--loading">
                  <span className="skeleton-block" />
                  <span className="skeleton-block" />
                  <span className="skeleton-block" />
                </div>
              ))}
            </div>
          ) : futureStars.length > 0 ? (
            <div className="future-stars-grid">
              {futureStars.map((player) => (
                <FutureStarCard key={player.playerId} player={player} />
              ))}
            </div>
          ) : (
            <div className="tool-placeholder">
              <p>Future Stars will appear after favorites are available and FastAPI is running.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default RecommendationsPage;
