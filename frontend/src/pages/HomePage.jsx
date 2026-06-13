import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Star, Bot, Telescope, Layers, Scale } from "lucide-react";

import ScoreCard from "../components/ScoreCard";
import { getCurrentUser } from "../services/api/userApi";
import { getTeam, getTeamSchedule } from "../services/api/teamApi";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import { formatGameDate, formatGameTime } from "../utils/datetime";
import { getTeamColor } from "../services/teamColors";
import {
  getApiErrorMessage,
  isUnauthorizedError,
} from "../services/api/apiError";
import { useReveal } from "../hooks/useReveal";
import { getLeaders, getHotPlayers } from "../services/api/statsApi";

const MLB_LOGO = "https://www.mlbstatic.com/team-logos/league-on-dark/1.svg";

const HEADSHOT_URL = (id) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;

// hitting の中で HOME に表示する代表カテゴリ（OPS / Hits は省略）
const FEATURED_HITTING = ["battingAverage", "homeRuns", "runsBattedIn", "stolenBases", "onBasePlusSlugging"];
const FEATURED_PITCHING = ["earnedRunAverage", "strikeouts", "saves"];

// ── ナビゲーションカード定義 ────────────────────────────────────────────────
// image: null のとき Icon を表示。将来 AI 生成画像 URL を渡すと差し替わる。
const NAV_CARDS = [
  {
    to: "/scout",
    Icon: Telescope,
    image: null,
    color: "var(--ctp-mauve)",
    title: "Player Scouting Report",
    desc: "Compare any MLB player against the league top 200. Percentile bars, strengths, weaknesses, and comparable players — all in one report.",
    label: "Scout a Player →",
  },
  {
    to: "/favorites",
    Icon: Star,
    image: null,
    color: "var(--ctp-yellow)",
    title: "Your Favorite Players",
    desc: "Players you've saved with personal notes and tags. Revisit stats and track their performance over the season.",
    label: "View Favorites →",
  },
  {
    to: "/recommendations",
    Icon: Bot,
    image: null,
    color: "var(--ctp-teal)",
    title: "Recommendations",
    desc: "Personalized MLB player picks based on your favorite team and saved players. Powered by FastAPI ML scoring.",
    label: "See Recommendations →",
  },
  {
    to: "/archetype/power-hitter",
    Icon: Layers,
    image: null,
    color: "var(--ctp-sapphire)",
    title: "Browse by Archetype",
    desc: "Explore players classified by playing style — Power Hitter, Speedster, Contact Hitter, Ace, and more.",
    label: "Browse Archetypes →",
  },
  {
    to: "/compare",
    Icon: Scale,
    image: null,
    color: "var(--ctp-green)",
    title: "Compare Players",
    desc: "Head-to-head stat comparison between any two MLB players. See who has the statistical edge across every category.",
    label: "Compare Now →",
  },
  {
    to: "/league",
    Icon: Trophy,
    image: null,
    color: "var(--ctp-peach)",
    title: "League Standings",
    desc: "Today's scores, division standings, and wild card races across the American and National League.",
    label: "View League →",
  },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// ── ナビゲーションカード ────────────────────────────────────────────────────
// image prop に URL を渡すとアイコンの代わりに画像を表示する（AI 画像差し替え用）
function NavCard({ to, Icon, image, color, title, desc, label }) {
  return (
    <Link to={to} className="home-nav-card">
      <div className="home-nav-card-visual" style={{ "--card-color": color }}>
        {image
          ? <img src={image} alt={title} className="home-nav-card-img" />
          : <Icon size={40} strokeWidth={1.4} style={{ color }} />
        }
      </div>
      <div className="home-nav-card-body">
        <h3 className="home-nav-card-title">{title}</h3>
        <p className="home-nav-card-desc">{desc}</p>
        <span className="home-nav-card-cta" style={{ color }}>{label}</span>
      </div>
    </Link>
  );
}

// ── League Leaders タブ ────────────────────────────────────────────────────
function LeadersTabs({ hitting, pitching }) {
  const [tab, setTab] = useState("hitting");
  const [catIdx, setCatIdx] = useState(0);

  const cats = tab === "hitting" ? hitting : pitching;
  const current = cats[catIdx] ?? cats[0];

  const handleTabChange = (next) => {
    setTab(next);
    setCatIdx(0);
  };

  if (!hitting.length && !pitching.length) return null;

  return (
    <div className="leaders-tabs-wrap">
      {/* Hitting / Pitching タブ */}
      <div className="leaders-tab-bar">
        <button
          className={`leaders-tab${tab === "hitting" ? " active" : ""}`}
          onClick={() => handleTabChange("hitting")}
        >
          Hitting
        </button>
        <button
          className={`leaders-tab${tab === "pitching" ? " active" : ""}`}
          onClick={() => handleTabChange("pitching")}
        >
          Pitching
        </button>
      </div>

      {/* スタットカテゴリ チップ */}
      <div className="leaders-cat-chips">
        {cats.map((c, i) => (
          <button
            key={c.category}
            className={`leaders-cat-chip${catIdx === i ? " active" : ""}`}
            onClick={() => setCatIdx(i)}
          >
            {c.abbr}
          </button>
        ))}
      </div>

      {/* ランキングリスト */}
      {current && (
        <div className="leaders-list">
          {current.leaders.map((p) => (
            <Link
              key={p.playerId}
              to={`/players/${p.playerId}`}
              className="leaders-list-row"
            >
              <span className="leaders-rank">{p.rank}</span>
              <img
                src={HEADSHOT_URL(p.playerId)}
                alt={p.playerName}
                className="leaders-list-headshot"
                onError={(e) => { e.currentTarget.style.opacity = "0.3"; }}
              />
              <div className="leaders-list-info">
                <span className="leaders-list-name">{p.playerName}</span>
                {p.teamId && (
                  <span className="leaders-list-team">
                    <img
                      src={`https://www.mlbstatic.com/team-logos/${p.teamId}.svg`}
                      alt={p.teamName}
                      width={14}
                      height={14}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    {p.teamName}
                  </span>
                )}
              </div>
              <span className="leaders-list-value">{p.value}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hot Streak ─────────────────────────────────────────────────────────────
function HotStreakList({ players, statLabel }) {
  if (!players?.length) return (
    <p className="hot-streak-empty">データを取得中...</p>
  );

  return (
    <div className="leaders-list">
      {players.map((p, i) => (
        <Link key={p.playerId} to={`/players/${p.playerId}`} className="leaders-list-row">
          <span className="leaders-rank">{i + 1}</span>
          <img
            src={HEADSHOT_URL(p.playerId)}
            alt={p.playerName}
            className="leaders-list-headshot"
            onError={(e) => { e.currentTarget.style.opacity = "0.3"; }}
          />
          <div className="leaders-list-info">
            <span className="leaders-list-name">{p.playerName}</span>
            {p.teamId && (
              <span className="leaders-list-team">
                <img
                  src={`https://www.mlbstatic.com/team-logos/${p.teamId}.svg`}
                  alt={p.teamName}
                  width={14}
                  height={14}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                {p.teamName}
              </span>
            )}
          </div>
          <div className="hot-streak-stat">
            <span className="leaders-list-value">{p.stat}</span>
            <span className="leaders-card-abbr">{p.statLabel}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function HotStreakTabs({ hitters, pitchers }) {
  const [tab, setTab] = useState("hitting");
  return (
    <div className="leaders-tabs-wrap">
      <div className="leaders-tab-bar">
        <button
          className={`leaders-tab${tab === "hitting" ? " active" : ""}`}
          onClick={() => setTab("hitting")}
        >
          Hitters
        </button>
        <button
          className={`leaders-tab${tab === "pitching" ? " active" : ""}`}
          onClick={() => setTab("pitching")}
        >
          Pitchers
        </button>
      </div>
      {tab === "hitting"
        ? <HotStreakList players={hitters} />
        : <HotStreakList players={pitchers} />
      }
    </div>
  );
}

// ── My Team ダッシュボード ──────────────────────────────────────────────────
function TeamDashboard({ team, lastGame, nextGame }) {
  const record = team.record;
  const featuredGame = nextGame || lastGame;
  const gameLabel = nextGame ? "Next Game" : "Last Game";

  return (
    <div className="team-dashboard">
      <div className="team-dashboard-left">
        <Link to={`/team/${team.id}`} className="team-summary-team">
          <img
            src={`https://www.mlbstatic.com/team-logos/${team.id}.svg`}
            alt={team.name}
            className="team-summary-logo"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <span className="team-summary-name">{team.name}</span>
        </Link>
        {record && (
          <div className="team-dashboard-stats">
            <div className="team-stat">
              <span className="team-stat-value">{record.wins}-{record.losses}</span>
              <span className="team-stat-label">Record</span>
            </div>
            <div className="team-stat">
              <span className="team-stat-value">#{record.divisionRank}</span>
              <span className="team-stat-label">Div</span>
            </div>
            <div className="team-stat">
              <span className="team-stat-value">{record.pct}</span>
              <span className="team-stat-label">PCT</span>
            </div>
            <div className="team-stat">
              <span className="team-stat-value">{record.lastTen}</span>
              <span className="team-stat-label">L10</span>
            </div>
            <div className="team-stat">
              <span className="team-stat-value">{record.streak}</span>
              <span className="team-stat-label">Streak</span>
            </div>
          </div>
        )}
      </div>

      {featuredGame && (
        <div className="team-dashboard-right">
          <span className="team-game-label">{gameLabel}</span>
          {featuredGame.abstractState === "Preview" ? (
            <div className="team-next-game">
              <div className="team-next-teams">
                {[featuredGame.away, featuredGame.home].map((t, i) => (
                  <Link key={i} to={`/team/${t.teamId}`} className="team-next-team">
                    <img
                      src={`https://www.mlbstatic.com/team-logos/${t.teamId}.svg`}
                      alt={t.teamName}
                      className="score-team-logo"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <span className="score-team-name">{t.teamName}</span>
                  </Link>
                ))}
              </div>
              <p className="team-next-time">
                {formatGameDate(featuredGame.gameDate, { weekday: "short", month: "short", day: "numeric", year: undefined })}
                {" · "}{formatGameTime(featuredGame.gameDate)} JST
              </p>
            </div>
          ) : (
            <ScoreCard game={featuredGame} />
          )}
        </div>
      )}
    </div>
  );
}

function HomePage() {
  const [user, setUser] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamSchedule, setTeamSchedule] = useState([]);
  const [hittingLeaders, setHittingLeaders] = useState([]);
  const [pitchingLeaders, setPitchingLeaders] = useState([]);
  const [hotHitters, setHotHitters] = useState([]);
  const [hotPitchers, setHotPitchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [teamRef, teamVisible] = useReveal();
  const [leadersRef, leadersVisible] = useReveal();
  const [hotRef, hotVisible] = useReveal();
  const token = getAuthToken();

  useEffect(() => {
    const fetchHomeData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setErrorMessage("");

        const currentUser = await getCurrentUser(token);
        setUser(currentUser);

        const teamPromise = currentUser.favoriteTeam?.id
          ? Promise.all([
              getTeam(currentUser.favoriteTeam.id),
              getTeamSchedule(currentUser.favoriteTeam.id),
            ])
          : Promise.resolve(null);

        const [teamResult, [hittingData, pitchingData], hotData] = await Promise.all([
          teamPromise,
          Promise.all([
            getLeaders({ type: "hitting", limit: 5 }),
            getLeaders({ type: "pitching", limit: 5 }),
          ]),
          getHotPlayers({ days: 14 }),
        ]);

        if (teamResult) {
          const [teamData, scheduleData] = teamResult;
          setTeamInfo(teamData);
          setTeamSchedule(scheduleData.games);
        }

        setHittingLeaders(
          (hittingData?.categories ?? [])
            .filter((c) => FEATURED_HITTING.includes(c.category))
            .sort((a, b) => FEATURED_HITTING.indexOf(a.category) - FEATURED_HITTING.indexOf(b.category))
        );
        setPitchingLeaders(
          (pitchingData?.categories ?? []).filter((c) => FEATURED_PITCHING.includes(c.category))
        );
        setHotHitters(hotData?.hitters ?? []);
        setHotPitchers(hotData?.pitchers ?? []);
      } catch (error) {
        console.error("Home error:", error);
        if (isUnauthorizedError(error)) {
          clearAuthData();
          setErrorMessage("Your login session expired. Please login again.");
          return;
        }
        setErrorMessage(getApiErrorMessage(error, "Failed to load home data."));
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, [token]);

  const { lastGame, nextGame } = useMemo(() => {
    const finals = teamSchedule.filter((g) => g.abstractState === "Final");
    const upcoming = teamSchedule.filter((g) => g.abstractState !== "Final");
    return {
      lastGame: finals.length ? finals[finals.length - 1] : null,
      nextGame: upcoming.length ? upcoming[0] : null,
    };
  }, [teamSchedule]);

  // --- Guest view ---
  if (!token) {
    return (
      <div className="home-page px-6 py-10">
        <section className="guest-hero">
          <div className="guest-hero-text">
            <p className="home-kicker text-sm">MERN Portfolio Project</p>
            <h1 className="guest-hero-title">
              MLB Favorite<br />Player Hub
            </h1>
            <p className="home-description mt-4 text-base md:text-lg">
              Search MLB players, explore stats, and build your own
              personalized favorite player list.
            </p>
            <div className="home-actions mt-8">
              <Link className="home-link" to="/register">Get Started</Link>
              <Link className="home-link secondary" to="/login">Login</Link>
            </div>
          </div>
          <div className="guest-hero-visual" aria-hidden="true">
            <img src={MLB_LOGO} alt="" className="guest-hero-logo" />
          </div>
        </section>

        <div className="home-nav-cards">
          {NAV_CARDS.map((card) => (
            <NavCard key={card.to} {...card} />
          ))}
        </div>

        <div className="home-tech-stack">
          {["MongoDB", "Express", "React", "Node.js", "MLB Stats API", "JWT"].map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </div>
    );
  }

  // --- Logged-in view ---
  const teamColor = getTeamColor(user?.favoriteTeam?.id);

  return (
    <div className="home-page">
      <section className="home-banner" style={{ "--team-color": teamColor }}>
        {user?.favoriteTeam?.id && (
          <img
            src={`https://www.mlbstatic.com/team-logos/${user.favoriteTeam.id}.svg`}
            alt=""
            aria-hidden="true"
            className="home-banner-watermark"
          />
        )}
        <div className="home-banner-content">
          <p className="home-banner-greeting">
            {getGreeting()}{user?.name ? `, ${user.name}` : ""}
          </p>
          {teamInfo ? (
            <div className="home-banner-team">
              <div className="home-banner-team-left">
                <Link to={`/team/${teamInfo.id}`} className="home-banner-team-link">
                  <img
                    src={`https://www.mlbstatic.com/team-logos/${teamInfo.id}.svg`}
                    alt={teamInfo.name}
                    className="home-banner-team-logo"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <span className="home-banner-team-name">{teamInfo.name}</span>
                </Link>
                {teamInfo.record && (
                  <p className="home-banner-record">
                    {teamInfo.record.wins}-{teamInfo.record.losses}
                    {" · "}#{teamInfo.record.divisionRank}
                    {" · "}{teamInfo.division?.replace(/^(American|National) League /, "")}
                  </p>
                )}
              </div>
              {(nextGame || lastGame) && (
                <div className="home-banner-next">
                  <span className="home-banner-next-label">
                    {nextGame ? "Next" : "Last"}
                  </span>
                  {(() => {
                    const g = nextGame || lastGame;
                    const isPreview = g.abstractState === "Preview";
                    return (
                      <>
                        <div className="home-banner-next-teams">
                          <span>{g.away.teamName}</span>
                          <span className="home-banner-next-sep">vs</span>
                          <span>{g.home.teamName}</span>
                        </div>
                        <p className="home-banner-next-time">
                          {isPreview
                            ? `${formatGameDate(g.gameDate, { weekday: "short", month: "short", day: "numeric", year: undefined })} · ${formatGameTime(g.gameDate)} JST`
                            : `${g.away.runs ?? "-"} - ${g.home.runs ?? "-"} · ${g.status}`}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : user?.favoriteTeam?.name ? (
            <p className="home-banner-team-name">{user.favoriteTeam.name}</p>
          ) : null}

          {user && !user.hasCompletedOnboarding && (
            <div className="home-onboarding-callout home-banner-callout">
              <strong>Onboarding is not complete yet.</strong>
              <p>Choose your favorite team and at least 3 favorite players.</p>
              <Link className="home-link" to="/onboarding/team">Complete Onboarding</Link>
            </div>
          )}
        </div>
      </section>

      {errorMessage && <p className="error-message px-6">{errorMessage}</p>}

      <div className="home-content px-6">
        {/* My Team ダッシュボード */}
        <section
          ref={teamRef}
          className={`home-player-section home-team-section reveal-left${teamVisible ? " visible" : ""}`}
        >
          <div className="section-heading-row">
            <div className="section-heading">
              <h2>Your Favorite Team</h2>
              <p>
                {user?.favoriteTeam?.name
                  ? `${user.favoriteTeam.name} — record and upcoming games.`
                  : "Choose a favorite team to show its summary here."}
              </p>
            </div>
            {user?.favoriteTeam?.id && (
              <Link className="view-all-link" to={`/team/${user.favoriteTeam.id}`}>
                View All →
              </Link>
            )}
          </div>
          {loading ? (
            <div className="team-dashboard-skeleton" />
          ) : user?.favoriteTeam?.id && teamInfo ? (
            <TeamDashboard team={teamInfo} lastGame={lastGame} nextGame={nextGame} />
          ) : (
            <div className="home-empty-state">
              <span className="empty-state-icon">
                <img src={MLB_LOGO} alt="" width={36} height={36} style={{ opacity: 0.5 }} />
              </span>
              <p className="empty-state-title">No favorite team yet</p>
              <p className="empty-state-desc">Choose a favorite team to see its summary here.</p>
              <Link className="home-link secondary" to="/onboarding/team">Choose Team</Link>
            </div>
          )}
        </section>

        {/* League Leaders */}
        {(hittingLeaders.length > 0 || pitchingLeaders.length > 0) && (
          <section
            ref={leadersRef}
            className={`home-leaders-section reveal-right${leadersVisible ? " visible" : ""}`}
          >
            <div className="section-heading-row">
              <div className="section-heading">
                <h2>League Leaders</h2>
                <p>Current season stat leaders across MLB.</p>
              </div>
              <Link className="view-all-link" to="/league">View All →</Link>
            </div>
            <LeadersTabs hitting={hittingLeaders} pitching={pitchingLeaders} />
          </section>
        )}

        {/* Hot Streak */}
        {(hotHitters.length > 0 || hotPitchers.length > 0) && (
          <section
            ref={hotRef}
            className={`home-leaders-section reveal-left${hotVisible ? " visible" : ""}`}
          >
            <div className="section-heading-row">
              <div className="section-heading">
                <h2>Hot Right Now</h2>
                <p>Players with the best performance over the last 14 days.</p>
              </div>
            </div>
            <HotStreakTabs hitters={hotHitters} pitchers={hotPitchers} />
          </section>
        )}

        {/* ナビゲーションカード */}
        <div className="home-nav-cards">
          {NAV_CARDS.map((card) => (
            <NavCard key={card.to} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
