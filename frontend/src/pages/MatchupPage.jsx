// 投手 vs 打者 対戦成績ページ
// URL: /matchup?pitcher=pitcherId&batter=batterId
//
// データの流れ:
//   URL params → useEffect で両選手を自動ロード
//   → 両方選択済み → GET /api/matchup?pitcherId=X&batterId=Y
//   → 対戦成績カードを表示

import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PlayerSearchSelect from "../components/PlayerSearchSelect";
import PageHeader from "../components/PageHeader";
import { getExternalPlayerDetail } from "../services/api/externalPlayerApi";
import { getMatchupStats } from "../services/api/matchupApi";

// レートスタット: 棒グラフで視覚化（max は現実的な上限値）
const RATE_STATS = [
  { key: "avg", label: "AVG", desc: "Batting Average", max: 1.0 },
  { key: "obp", label: "OBP", desc: "On-Base %",       max: 1.0 },
  { key: "slg", label: "SLG", desc: "Slugging %",      max: 4.0 },
  { key: "ops", label: "OPS", desc: "OPS",             max: 5.0 },
];

// カウント統計: シンプルな数値表示
const COUNT_STATS = [
  { key: "rbi",             label: "RBI",  desc: "RBI"       },
  { key: "baseOnBalls",     label: "BB",   desc: "Walks"     },
  { key: "numberOfPitches", label: "#P",   desc: "Pitches"   },
];

// 選手カード: Compare ページの cbattle-card と同じ構造・CSS クラスを使う
function SelectedPlayerCard({ player, side }) {
  return (
    <div className={`cbattle-card cbattle-card--${side}`}>
      {player.image && (
        <img
          src={player.image}
          alt={player.name || player.fullName}
          className="cbattle-img"
        />
      )}
      <Link
        to={`/players/${player.mlbPlayerId}`}
        state={{ from: "/matchup", fromLabel: "Back to Matchup" }}
        className="cbattle-name"
      >
        {player.name || player.fullName}
      </Link>
      <div className="cbattle-meta">
        {player.teamId && (
          <img
            src={`https://www.mlbstatic.com/team-logos/${player.teamId}.svg`}
            alt={player.team}
            style={{ width: 16, height: 16 }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}
        <span>{player.team}</span>
        <span className="cbattle-pos">{player.position}</span>
      </div>
    </div>
  );
}

// 棒グラフ行（Compare ページのバースタイルを参考）
function RateBar({ statDef, value }) {
  const num = parseFloat(value);
  const pct = isNaN(num) ? 0 : Math.min((num / statDef.max) * 100, 100);
  const ready = useRef(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mbar-row">
      {/* ラベル */}
      <span className="mbar-label">{statDef.label}</span>

      {/* バートラック */}
      <div className="mbar-track">
        <div
          className="mbar-fill"
          style={{ width: animated ? `${pct}%` : "0%" }}
        />
      </div>

      {/* 値 */}
      <span className="mbar-value">{value ?? "—"}</span>
    </div>
  );
}

// 対戦成績（新デザイン）
function MatchupStatsGrid({ stats, pitcher, batter }) {
  return (
    <div className="matchup-stats-wrap">
      <p className="matchup-stats-title">Career Matchup Stats</p>

      {/* ① サマリー行: 主要カウントをピルで一覧 */}
      <div className="mstats-summary">
        {[
          { label: "G",  value: stats.gamesPlayed },
          { label: "AB", value: stats.atBats       },
          { label: "H",  value: stats.hits          },
          { label: "HR", value: stats.homeRuns      },
          { label: "SO", value: stats.strikeOuts    },
        ].map(({ label, value }) => (
          <div key={label} className="mstats-pill">
            <span className="mstats-pill-value">{value ?? "—"}</span>
            <span className="mstats-pill-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ② レートスタット: 棒グラフ */}
      <div className="mstats-bars">
        <p className="mstats-section-title">Rate Stats</p>
        {RATE_STATS.map((s) => (
          <RateBar key={s.key} statDef={s} value={stats[s.key]} />
        ))}
      </div>

      {/* ③ 補足カウント */}
      <div className="mstats-counts">
        <p className="mstats-section-title">Additional</p>
        <div className="mstats-count-row">
          {COUNT_STATS.map(({ key, label, desc }) => (
            <div key={key} className="mstats-count-cell">
              <span className="mstats-count-value">{stats[key] ?? "—"}</span>
              <span className="mstats-count-label">{label}</span>
              <span className="mstats-count-desc">{desc}</span>
            </div>
          ))}
        </div>
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
    <div className="app-screen">
      <PageHeader
        kicker={`${new Date().getFullYear()} Career`}
        title="Pitcher vs Batter"
        subtitle="Select a pitcher and a batter to see their career head-to-head stats."
        backTo="/favorites"
        backLabel="Pick from Favorites"
      />

      <div className="screen-body px-6 py-6 w-full">
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

            {/* 選択済みカード: Compare ページと同じ cbattle-header 構造 */}
            {bothSelected && (
              <div className="cbattle-wrap">
                <div className="cbattle-header">
                  <div className="cbattle-side cbattle-side--left">
                    <SelectedPlayerCard player={pitcher} side="left" />
                  </div>
                  <div className="cbattle-vs-col">
                    <span className="cbattle-vs">VS</span>
                  </div>
                  <div className="cbattle-side cbattle-side--right">
                    <SelectedPlayerCard player={batter} side="right" />
                  </div>
                </div>
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
