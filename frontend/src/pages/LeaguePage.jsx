// リーグページ: 30球団の試合成績を2つのタブで表示
//   [Standings] 順位表（リーグ → 地区 → 球団）
//   [Scores]    指定日の全試合スコア
//
// データの流れ:
//   Standings タブ → GET /api/league/standings?season=YYYY
//   Scores タブ    → GET /api/league/scores?date=YYYY-MM-DD（日付ピッカーで切替）

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStandings, getScores } from "../services/api/leagueApi";
import ScoreCard from "../components/ScoreCard";

const TABS = [
  { key: "standings", label: "Standings" },
  { key: "scores", label: "Scores" },
];

// 地区の表示順（AL → NL、East → Central → West）
const DIVISION_ORDER = [
  "American League East",
  "American League Central",
  "American League West",
  "National League East",
  "National League Central",
  "National League West",
];

const LEAGUE_ORDER = ["American League", "National League"];

// ── Standings タブ ───────────────────────────────────────────────────────────
function StandingsTab({ season }) {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getStandings(season);
        // 地区を決まった順に並べ替え
        const sorted = [...data.divisions].sort((a, b) => {
          const aKey = `${a.league} ${a.division}`;
          const bKey = `${b.league} ${b.division}`;
          return DIVISION_ORDER.indexOf(aKey) - DIVISION_ORDER.indexOf(bKey);
        });
        setDivisions(sorted);
      } catch {
        setError("Failed to load standings.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [season]);

  if (loading) return <p className="compare-loading">Loading standings…</p>;
  if (error) return <p className="error-message">{error}</p>;

  const divisionsByLeague = LEAGUE_ORDER.map((league) => ({
    league,
    divisions: divisions.filter((div) => div.league === league),
  }));

  return (
    <div className="standings-grid">
      {divisionsByLeague.map(({ league, divisions: leagueDivisions }) => (
        <section key={league} className="standings-league-column">
          <h2 className="standings-league-title">{league}</h2>
          {leagueDivisions.map((div) => (
            <div key={div.divisionId} className="standings-division">
              <p className="standings-division-title">
                <span>{div.division}</span>
              </p>
              <div className="standings-table">
                {/* ヘッダー行 */}
                <div className="standings-row standings-row--head">
                  <span className="standings-team-col">Team</span>
                  <span>W</span>
                  <span>L</span>
                  <span>PCT</span>
                  <span>GB</span>
                  <span className="standings-hide-sm">L10</span>
                  <span className="standings-hide-sm">STRK</span>
                </div>
                {/* 球団行 */}
                {div.teams.map((t, idx) => (
                  <div
                    key={t.teamId}
                    className={`standings-row${idx === 0 ? " standings-row--leader" : ""}`}
                  >
                    <Link
                      to={`/team/${t.teamId}`}
                      className="standings-team-col standings-team-link"
                    >
                      <img
                        src={`https://www.mlbstatic.com/team-logos/${t.teamId}.svg`}
                        alt={t.teamName}
                        className="standings-team-logo"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                      <span className="standings-team-name">{t.teamName}</span>
                    </Link>
                    <span className="standings-stat">{t.wins}</span>
                    <span className="standings-stat">{t.losses}</span>
                    <span className="standings-stat">{t.pct}</span>
                    <span className="standings-stat">{t.gamesBack}</span>
                    <span className="standings-stat standings-hide-sm">{t.lastTen}</span>
                    <span className="standings-stat standings-hide-sm">{t.streak}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

// ── Scores タブ ──────────────────────────────────────────────────────────────
function ScoresTab() {
  // 日付は YYYY-MM-DD 文字列で管理
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getScores(date);
        setGames(data.games);
      } catch {
        setError("Failed to load scores.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date]);

  // 日付を1日ずらす
  const shiftDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  const displayDate = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="scores-wrap">
      {/* 日付ナビゲーション */}
      <div className="scores-date-nav">
        <button type="button" className="scores-date-btn" onClick={() => shiftDate(-1)}>
          ← Prev
        </button>
        <div className="scores-date-display">
          <span className="scores-date-text">{displayDate}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="scores-date-input"
          />
        </div>
        <button type="button" className="scores-date-btn" onClick={() => shiftDate(1)}>
          Next →
        </button>
      </div>

      {loading && <p className="compare-loading">Loading scores…</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && games.length === 0 && (
        <div className="home-empty-state">
          <span className="empty-state-icon">📅</span>
          <p className="empty-state-title">No games scheduled</p>
          <p className="empty-state-desc">There are no MLB games on this date.</p>
        </div>
      )}

      {!loading && games.length > 0 && (
        <div className="scores-grid">
          {games.map((g) => (
            <ScoreCard key={g.gamePk} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── メインページ ─────────────────────────────────────────────────────────────
function LeaguePage() {
  const [activeTab, setActiveTab] = useState("standings");
  const season = new Date().getFullYear();

  return (
    <div className="home-page px-6 py-12">
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">{season} Season</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          League
        </h1>
        <p className="home-description mt-4 text-base">
          Standings and game scores for all 30 MLB teams.
        </p>
      </section>

      <div className="home-content mt-2 w-full">
        {/* タブ */}
        <div className="stats-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`stats-tab ${activeTab === tab.key ? "stats-tab--active" : ""}`}
            >
              <span className="stats-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "standings" ? (
          <StandingsTab season={season} />
        ) : (
          <ScoresTab />
        )}
      </div>
    </div>
  );
}

export default LeaguePage;
