// 投手 vs 打者 対戦成績ページ
// URL: /matchup?pitcher=pitcherId&batter=batterId
//
// データの流れ:
//   URL params → useEffect で両選手を自動ロード
//   → 両方選択済み → GET /api/matchup?pitcherId=X&batterId=Y
//   → 対戦成績カードを表示

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PlayerSearchSelect from "../components/PlayerSearchSelect";
import { getExternalPlayerDetail } from "../services/api/externalPlayerApi";
import { getMatchupStats } from "../services/api/matchupApi";

// 表示するスタット定義
const MATCHUP_STATS = [
  { key: "gamesPlayed",     label: "G",    desc: "Games"         },
  { key: "atBats",          label: "AB",   desc: "At Bats"       },
  { key: "hits",            label: "H",    desc: "Hits"          },
  { key: "homeRuns",        label: "HR",   desc: "Home Runs"     },
  { key: "rbi",             label: "RBI",  desc: "RBI"           },
  { key: "strikeOuts",      label: "SO",   desc: "Strikeouts"    },
  { key: "baseOnBalls",     label: "BB",   desc: "Walks"         },
  { key: "avg",             label: "AVG",  desc: "Batting Avg"   },
  { key: "obp",             label: "OBP",  desc: "On-Base %"     },
  { key: "slg",             label: "SLG",  desc: "Slugging %"    },
  { key: "ops",             label: "OPS",  desc: "OPS"           },
  { key: "numberOfPitches", label: "#P",   desc: "Pitches"       },
];

// 選手カード（選択済みの場合に表示）
function SelectedPlayerCard({ player, role }) {
  const isLeft = role === "pitcher";
  return (
    <div className={`matchup-player-card matchup-player-card--${role}`}>
      <p className="matchup-role-label">{role === "pitcher" ? "⚾ Pitcher" : "🏏 Batter"}</p>
      {player.image && (
        <img
          src={player.image}
          alt={player.name || player.fullName}
          className="matchup-player-img"
        />
      )}
      <Link
        to={`/players/${player.mlbPlayerId}`}
        state={{ from: "/matchup", fromLabel: "Back to Matchup" }}
        className="matchup-player-name"
      >
        {player.name || player.fullName}
      </Link>
      <div className="matchup-player-meta">
        {player.teamId && (
          <img
            src={`https://www.mlbstatic.com/team-logos/${player.teamId}.svg`}
            alt={player.team}
            style={{ width: 16, height: 16 }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}
        <span>{player.team}</span>
        <span className="matchup-player-pos">{player.position}</span>
      </div>
    </div>
  );
}

// 対戦成績グリッド
function MatchupStatsGrid({ stats }) {
  return (
    <div className="matchup-stats-wrap">
      <p className="matchup-stats-title">Career Matchup Stats</p>
      <div className="matchup-stats-grid">
        {MATCHUP_STATS.map(({ key, label, desc }) => (
          <div key={key} className="matchup-stat-cell">
            <span className="matchup-stat-label">{label}</span>
            <span className="matchup-stat-value">{stats[key] ?? "—"}</span>
            <span className="matchup-stat-desc">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchupPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pitcher, setPitcher] = useState(null);
  const [batter, setBatter] = useState(null);
  const [matchupStats, setMatchupStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingInit, setLoadingInit] = useState(false);

  // URL params から選手を自動ロード (PlayerDetailPage からの導線)
  useEffect(() => {
    const pitcherId = searchParams.get("pitcher");
    const batterId  = searchParams.get("batter");
    if (!pitcherId && !batterId) return;

    const load = async () => {
      setLoadingInit(true);
      try {
        const [p, b] = await Promise.all([
          pitcherId ? getExternalPlayerDetail(pitcherId) : Promise.resolve(null),
          batterId  ? getExternalPlayerDetail(batterId)  : Promise.resolve(null),
        ]);
        if (p) setPitcher(p);
        if (b) setBatter(b);
      } catch {
        // silent fallback
      } finally {
        setLoadingInit(false);
      }
    };
    load();
  }, []);  // 初回マウント時のみ

  // 両選手が揃ったら対戦成績を取得
  useEffect(() => {
    if (!pitcher || !batter) {
      setMatchupStats(null);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getMatchupStats(
          pitcher.mlbPlayerId,
          batter.mlbPlayerId,
        );
        setMatchupStats(result);
      } catch {
        setError("Failed to load matchup stats.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [pitcher, batter]);

  // 選手選択時に URL params を更新（ブックマーク・共有対応）
  const handleSetPitcher = (p) => {
    setPitcher(p);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p) next.set("pitcher", p.mlbPlayerId);
      else next.delete("pitcher");
      return next;
    });
  };

  const handleSetBatter = (b) => {
    setBatter(b);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (b) next.set("batter", b.mlbPlayerId);
      else next.delete("batter");
      return next;
    });
  };

  const bothSelected = pitcher && batter;

  return (
    <div className="home-page px-6 py-12">
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">{new Date().getFullYear()} Career</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          Pitcher vs Batter
        </h1>
        <p className="home-description mt-4 text-base">
          Select a pitcher and a batter to see their career head-to-head stats.
        </p>
        <div className="home-actions mt-6">
          <Link className="home-link secondary" to="/favorites">
            ← Pick from Favorites
          </Link>
        </div>
      </section>

      <div className="home-content mt-2 w-full">
        {loadingInit ? (
          <p className="compare-loading">Loading players…</p>
        ) : (
          <>
            {/* 選手選択スロット */}
            <div className="compare-search-row">
              <PlayerSearchSelect
                label="⚾ Pitcher"
                player={pitcher}
                onSelect={handleSetPitcher}
              />
              <div className="compare-vs">VS</div>
              <PlayerSearchSelect
                label="🏏 Batter"
                player={batter}
                onSelect={handleSetBatter}
              />
            </div>

            {/* 選択済みカード */}
            {bothSelected && (
              <div className="matchup-header">
                <SelectedPlayerCard player={pitcher} role="pitcher" />
                <div className="matchup-vs-badge">VS</div>
                <SelectedPlayerCard player={batter} role="batter" />
              </div>
            )}

            {/* 対戦成績 */}
            {loading && (
              <p className="compare-loading">Loading matchup stats…</p>
            )}

            {error && <p className="error-message">{error}</p>}

            {!loading && matchupStats && (
              matchupStats.hasData ? (
                <MatchupStatsGrid stats={matchupStats.stats} />
              ) : (
                <div className="home-empty-state">
                  <span className="empty-state-icon">📋</span>
                  <p className="empty-state-title">No matchup data found</p>
                  <p className="empty-state-desc">
                    These two players have no recorded head-to-head matchups.
                  </p>
                </div>
              )
            )}

            {/* 未選択の案内 */}
            {!bothSelected && !loading && (
              <div className="home-empty-state">
                <span className="empty-state-icon">⚾</span>
                <p className="empty-state-title">Select a pitcher and a batter</p>
                <p className="empty-state-desc">
                  Search by name above, or pick players from your Favorites.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MatchupPage;
