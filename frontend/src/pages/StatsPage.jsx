import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLeaders } from "../services/api/statsApi";
import { getApiErrorMessage } from "../services/api/apiError";

const TABS = [
  { key: "hitting", label: "Position Players" },
  { key: "pitching", label: "Pitchers" },
];

function LeaderTable({ category }) {
  return (
    <div className="stats-category-card">
      <div className="stats-category-header">
        <span className="stats-abbr">{category.abbr}</span>
        <span className="stats-label">{category.label}</span>
      </div>
      <ol className="stats-leader-list">
        {category.leaders.map((entry, idx) => (
          <li key={`${entry.playerId}-${idx}`} className="stats-leader-row">
            <span className={`stats-rank ${entry.rank === 1 ? "stats-rank--gold" : entry.rank === 2 ? "stats-rank--silver" : entry.rank === 3 ? "stats-rank--bronze" : ""}`}>
              {entry.rank}
            </span>
            <div className="stats-player-info">
              {entry.teamId && (
                <img
                  src={`https://www.mlbstatic.com/team-logos/${entry.teamId}.svg`}
                  alt={entry.teamName}
                  className="stats-team-logo"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
              <Link
                to={`/players/${entry.playerId}`}
                className="stats-player-name"
              >
                {entry.playerName}
              </Link>
              <span className="stats-team-name">{entry.teamName}</span>
            </div>
            <span className="stats-value">{entry.value}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SkeletonLeaderTable() {
  return (
    <div className="stats-category-card stats-category-card--skeleton">
      <div className="stats-category-header">
        <span className="skeleton-block" style={{ width: "3rem", height: "1.25rem", borderRadius: "4px" }} />
        <span className="skeleton-block" style={{ width: "5rem", height: "1rem", borderRadius: "4px" }} />
      </div>
      <ol className="stats-leader-list">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="stats-leader-row">
            <span className="skeleton-block" style={{ width: "1.5rem", height: "1rem", borderRadius: "4px" }} />
            <div className="stats-player-info" style={{ flex: 1 }}>
              <span className="skeleton-block" style={{ width: "60%", height: "1rem", borderRadius: "4px" }} />
            </div>
            <span className="skeleton-block" style={{ width: "2.5rem", height: "1rem", borderRadius: "4px" }} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatsPage() {
  const [activeTab, setActiveTab] = useState("hitting");
  const [data, setData] = useState({ hitting: null, pitching: null });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const currentSeason = new Date().getFullYear();

  useEffect(() => {
    if (data[activeTab]) return;

    const fetchLeaders = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const result = await getLeaders({ type: activeTab, limit: 10 });
        setData((prev) => ({ ...prev, [activeTab]: result.categories }));
      } catch (error) {
        console.error("Stats fetch error:", error);
        setErrorMessage(getApiErrorMessage(error, "Failed to load stats."));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, [activeTab, data]);

  const categories = data[activeTab];

  return (
    <div className="home-page px-6 py-12">
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">{currentSeason} Season</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          MLB Stats
        </h1>
        <p className="home-description mt-4 text-base">
          League leaders from the MLB Stats API.
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

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="stats-grid">
          {loading || !categories
            ? Array.from({ length: 6 }, (_, i) => <SkeletonLeaderTable key={i} />)
            : categories.map((cat) => (
                <LeaderTable key={cat.category} category={cat} />
              ))}
        </div>
      </div>
    </div>
  );
}

export default StatsPage;
