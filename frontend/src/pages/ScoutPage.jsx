import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Telescope, X } from "lucide-react";

import PageHeader from "../components/PageHeader";
import { fetchPlayerSuggestions } from "../services/api/externalPlayerApi";
import { getScoutingReport } from "../services/api/scoutApi";

const HITTER_STAT_META = [
  { key: "ops",         label: "OPS",        short: "OPS", desc: "On-base + Slugging" },
  { key: "homeRuns",    label: "Power",       short: "HR",  desc: "Home Runs" },
  { key: "stolenBases", label: "Speed",       short: "SB",  desc: "Stolen Bases" },
  { key: "avg",         label: "Batting Avg", short: "AVG", desc: "AVG" },
  { key: "rbi",         label: "RBI",         short: "RBI", desc: "Runs Batted In" },
];

const PITCHER_STAT_META = [
  { key: "era",        label: "ERA",        short: "ERA",  desc: "Earned Run Avg (lower = better)" },
  { key: "whip",       label: "WHIP",       short: "WHIP", desc: "Walks + Hits per IP" },
  { key: "strikeouts", label: "Strikeouts", short: "K",    desc: "Total K this season" },
  { key: "walks",      label: "Control",    short: "BB",   desc: "BB allowed (fewer = better)" },
  { key: "wins",       label: "Wins",       short: "W",    desc: "Wins this season" },
  { key: "innings",    label: "Durability", short: "IP",   desc: "Innings Pitched" },
];

function percentileColor(pct) {
  if (pct >= 80) return "var(--ctp-green)";
  if (pct >= 50) return "var(--ctp-blue)";
  if (pct >= 30) return "var(--ctp-yellow)";
  return "var(--ctp-red)";
}

function PercentileBar({ label, desc, percentile, index = 0 }) {
  const [width, setWidth] = useState(0);
  const color = percentileColor(percentile);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentile), 80 + index * 80);
    return () => clearTimeout(timer);
  }, [percentile, index]);

  return (
    <div className="scout-stat-row">
      <div className="scout-stat-label">
        <span className="scout-stat-name">{label}</span>
        <span className="scout-stat-desc">{desc}</span>
      </div>
      <div className="scout-bar-wrap">
        <div
          className="scout-bar-fill"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
      <span className="scout-stat-pct" style={{ color }}>
        {percentile}
        <sup>th</sup>
      </span>
    </div>
  );
}

function PlayerTypeTag({ type }) {
  return (
    <span className="scout-player-type">
      <Telescope size={13} strokeWidth={2.5} />
      {type}
    </span>
  );
}

const CX = 150;
const CY = 150;
const R  = 100;

function polarToXY(angleRad, radius) {
  return {
    x: CX + radius * Math.cos(angleRad),
    y: CY + radius * Math.sin(angleRad),
  };
}

function ScoutRadarChart({ percentiles, statMeta }) {
  const [animated, setAnimated] = useState(false);
  const n = statMeta.length;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // 各軸の角度（上から時計回り、-π/2 スタート）
  const angles = statMeta.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);

  // グリッド線（25 / 50 / 75 / 100 の4段）
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // 選手データのポリゴン頂点
  const dataPoints = statMeta.map(({ key }, i) => {
    const value = animated ? (percentiles[key] ?? 50) : 0;
    const ratio = value / 100;
    return polarToXY(angles[i], R * ratio);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="scout-radar-wrap">
      <svg viewBox="0 0 300 300" width="100%" style={{ display: "block" }}>
        {/* グリッド */}
        {gridLevels.map((level) => {
          const pts = angles.map((a) => polarToXY(a, R * level));
          return (
            <polygon
              key={level}
              points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#313244"
              strokeWidth="1"
            />
          );
        })}

        {/* 軸線 */}
        {angles.map((a, i) => {
          const end = polarToXY(a, R);
          return (
            <line
              key={i}
              x1={CX} y1={CY}
              x2={end.x} y2={end.y}
              stroke="#313244"
              strokeWidth="1"
            />
          );
        })}

        {/* データポリゴン */}
        <polygon
          points={dataPolygon}
          fill="#74c7ec"
          fillOpacity="0.2"
          stroke="#74c7ec"
          strokeWidth="2"
          style={{ transition: "all 700ms cubic-bezier(0.4,0,0.2,1)" }}
        />

        {/* 頂点の点 */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#74c7ec" />
        ))}

        {/* ラベル */}
        {statMeta.map(({ short }, i) => {
          const labelR = R + 22;
          const pos = polarToXY(angles[i], labelR);
          const anchor =
            Math.abs(pos.x - CX) < 5 ? "middle"
            : pos.x < CX ? "end"
            : "start";
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="700"
              fill="#a6adc8"
            >
              {short}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function OverallScore({ percentiles }) {
  const values = Object.values(percentiles);
  const score = values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;
  const color = percentileColor(score);
  return (
    <div className="scout-overall-score" style={{ borderColor: color }}>
      <span className="scout-overall-value" style={{ color }}>{score}</span>
      <span className="scout-overall-label">Overall</span>
    </div>
  );
}

function ScoutReport({ data }) {
  const { player, stats, report } = data;

  return (
    <article className="scout-report">
      {/* 選手ヘッダー */}
      <header className="scout-report-header">
        <img
          src={player.image}
          alt={player.fullName}
          className="scout-report-headshot"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div className="scout-report-info">
          <h2 className="scout-report-name">{player.fullName}</h2>
          <p className="scout-report-meta">
            {player.currentTeam} · {player.position}
          </p>
          {report?.playerType && <PlayerTypeTag type={report.playerType} />}
        </div>
        {report?.percentiles && (
          <OverallScore percentiles={report.percentiles} />
        )}
      </header>

      {/* FastAPI 未起動の場合 */}
      {!report && (
        <div className="scout-no-report">
          <p>Stats loaded. Start the FastAPI service to see the full analysis.</p>
          {player.playerType === "pitcher" ? (
            <dl className="scout-raw-stats">
              <div><dt>ERA</dt><dd>{stats.era?.toFixed(2) || "-"}</dd></div>
              <div><dt>WHIP</dt><dd>{stats.whip?.toFixed(3) || "-"}</dd></div>
              <div><dt>K</dt><dd>{stats.strikeouts || "-"}</dd></div>
              <div><dt>BB</dt><dd>{stats.walks || "-"}</dd></div>
              <div><dt>W</dt><dd>{stats.wins || "-"}</dd></div>
              <div><dt>IP</dt><dd>{stats.innings || "-"}</dd></div>
            </dl>
          ) : (
            <dl className="scout-raw-stats">
              <div><dt>OPS</dt><dd>{stats.ops?.toFixed(3) || "-"}</dd></div>
              <div><dt>HR</dt><dd>{stats.homeRuns || "-"}</dd></div>
              <div><dt>SB</dt><dd>{stats.stolenBases || "-"}</dd></div>
              <div><dt>AVG</dt><dd>{stats.avg?.toFixed(3) || "-"}</dd></div>
              <div><dt>RBI</dt><dd>{stats.rbi || "-"}</dd></div>
            </dl>
          )}
        </div>
      )}

      {/* フル分析レポート */}
      {report && (
        <>
          {/* バッティング / ピッチングプロファイル */}
          <section className="scout-section">
            <h3 className="scout-section-title">
              {player.playerType === "pitcher" ? "Pitching Profile" : "Batting Profile"}
            </h3>
            <div className="scout-profile-grid">
              <ScoutRadarChart
                percentiles={report.percentiles}
                statMeta={player.playerType === "pitcher" ? PITCHER_STAT_META : HITTER_STAT_META}
              />
              <div className="scout-stat-list">
                {(player.playerType === "pitcher" ? PITCHER_STAT_META : HITTER_STAT_META).map(({ key, label, desc }, i) => (
                  <PercentileBar
                    key={key}
                    label={label}
                    desc={desc}
                    percentile={report.percentiles[key] ?? 50}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* 強み */}
          {report.strengths.length > 0 && (
            <section className="scout-section">
              <h3 className="scout-section-title">Strengths</h3>
              <div className="scout-tags">
                {report.strengths.map((s) => (
                  <span key={s} className="scout-tag scout-tag--strength">{s}</span>
                ))}
              </div>
            </section>
          )}

          {/* 弱み */}
          {report.weaknesses.length > 0 && (
            <section className="scout-section">
              <h3 className="scout-section-title">Weaknesses</h3>
              <div className="scout-tags">
                {report.weaknesses.map((w) => (
                  <span key={w} className="scout-tag scout-tag--weakness">{w}</span>
                ))}
              </div>
            </section>
          )}

          {/* 類似選手 */}
          {report.comparablePlayers.length > 0 && (
            <section className="scout-section">
              <h3 className="scout-section-title">Comparable Players</h3>
              <ul className="scout-comparables">
                {report.comparablePlayers.map((cp) => (
                  <li key={cp.playerId} className="scout-comparable-item">
                    <span className="scout-comparable-name">{cp.name}</span>
                    <span className="scout-comparable-team">{cp.team}</span>
                    <span
                      className="scout-comparable-sim"
                      style={{ color: percentileColor(cp.similarityPercentage) }}
                    >
                      {cp.similarityPercentage}% match
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </article>
  );
}

function ScoutSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await fetchPlayerSuggestions(value.trim());
      setSuggestions(results.slice(0, 8));
      setSearching(false);
    }, 300);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
  };

  return (
    <div className="scout-search-wrap" ref={wrapperRef}>
      <div className="scout-search-input-row">
        <Search size={18} className="scout-search-icon" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search any MLB player…"
          className="scout-search-input"
          autoFocus
        />
        {query && (
          <button type="button" className="scout-search-clear" onClick={handleClear}>
            <X size={16} />
          </button>
        )}
      </div>

      {searching && <p className="scout-search-status">Searching…</p>}

      {suggestions.length > 0 && (
        <ul className="scout-suggestions">
          {suggestions.map((s) => (
            <li key={s.id || s.playerId}>
              <button
                type="button"
                className="scout-suggestion-item"
                onClick={() => onSelect(s.id || s.playerId)}
              >
                <span className="scout-suggestion-name">{s.fullName || s.name}</span>
                {s.position && (
                  <span className="scout-suggestion-pos">{s.position}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScoutPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!playerId) {
      setReportData(null);
      return;
    }

    let active = true;

    const fetchReport = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getScoutingReport(playerId);
        if (active) setReportData(data);
      } catch (err) {
        if (active) setError(err.message || "Failed to load scouting report.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReport();
    return () => { active = false; };
  }, [playerId]);

  const handleSelect = (id) => {
    navigate(`/scout/${id}`);
  };

  return (
    <div className="app-screen">
      <PageHeader
        accentColor="var(--ctp-sapphire)"
        backTo={playerId ? "/scout" : undefined}
        backLabel={playerId ? "Search" : undefined}
        kicker="Analysis"
        title="Scouting Report"
        subtitle={
          playerId
            ? "Player profile vs the league top 200."
            : "Search any MLB player to generate a personalized report."
        }
      />

      <div className="screen-body scout-page px-6 py-6 w-full">
        {/* 選手が選ばれていない場合は検索ボックスを表示 */}
        {!playerId && (
          <>
            <ScoutSearch onSelect={handleSelect} />
            <div className="scout-empty-hint">
              <Telescope size={40} strokeWidth={1.2} className="scout-hint-icon" />
              <p>Select a player above to generate their scouting report.</p>
              <p className="scout-hint-sub">
                Compares stats vs the current season's top 200 hitters or pitchers.
              </p>
            </div>
          </>
        )}

        {/* 選手が選ばれている場合：検索 + レポート */}
        {playerId && (
          <>
            <ScoutSearch onSelect={handleSelect} />
            {loading && (
              <div className="scout-loading">
                <div className="scout-skeleton-header" />
                <div className="scout-skeleton-bars">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="scout-skeleton-row">
                      <span className="skeleton-block" style={{ width: "30%" }} />
                      <span className="skeleton-block" style={{ width: "55%" }} />
                      <span className="skeleton-block" style={{ width: "10%" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && reportData && (
              <ScoutReport data={reportData} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ScoutPage;
