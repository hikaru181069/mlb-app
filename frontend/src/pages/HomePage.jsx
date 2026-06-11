import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Trophy, Scale, Swords, Star, Shield,
  Bot, Lock, Telescope,
} from "lucide-react";

const MLB_LOGO = "https://www.mlbstatic.com/team-logos/league-on-dark/1.svg";

import PlayerCard from "../components/PlayerCard";
import SkeletonCard from "../components/SkeletonCard";
import ScoreCard from "../components/ScoreCard";
import { getFavorites } from "../services/api/favoriteApi";
import { getRecommendations } from "../services/api/recommendationApi";
import { getCurrentUser } from "../services/api/userApi";
import { getTeam, getTeamSchedule } from "../services/api/teamApi";
import { getScores } from "../services/api/leagueApi";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import { mlbToday, formatGameDate, formatGameTime } from "../utils/datetime";
import { getTeamColor } from "../services/teamColors";
import {
  getApiErrorMessage,
  isUnauthorizedError,
} from "../services/api/apiError";
import { useReveal } from "../hooks/useReveal";

const SKELETON_COUNTS = { team: 2, favorites: 6, recommendations: 6, today: 4 };

const ARCHETYPES = [
  { slug: "power-hitter",    label: "Power Hitter",    desc: "Elite HR production",         color: "var(--ctp-red)"      },
  { slug: "speedster",       label: "Speedster",        desc: "Elite speed & stolen bases",  color: "var(--ctp-teal)"     },
  { slug: "contact-hitter",  label: "Contact Hitter",   desc: "High avg, consistent contact",color: "var(--ctp-green)"    },
  { slug: "five-tool-threat",label: "Five-Tool Threat", desc: "Power, speed, and contact",   color: "var(--ctp-yellow)"   },
  { slug: "all-around",      label: "All-Around",       desc: "Balanced offensive player",   color: "var(--ctp-blue)"     },
  { slug: "ace",             label: "Ace",              desc: "Staff cornerstone pitcher",   color: "var(--ctp-mauve)"    },
  { slug: "power-pitcher",   label: "Power Pitcher",    desc: "Overpowering strikeouts",     color: "var(--ctp-maroon)"   },
  { slug: "control-artist",  label: "Control Artist",   desc: "Exceptional command",         color: "var(--ctp-sapphire)" },
  { slug: "workhorse",       label: "Workhorse",        desc: "Durable innings-eater",       color: "var(--ctp-peach)"    },
];

const QUICK_ACTIONS = [
  { to: "/search",    Icon: Search,  label: "Search"    },
  { to: "/league",    Icon: Trophy,  label: "League"    },
  { to: "/compare",   Icon: Scale,   label: "Compare"   },
  { to: "/matchup",   Icon: Swords,  label: "Matchup"   },
  { to: "/favorites", Icon: Star,    label: "Favorites" },
];

// 時間帯によるあいさつ（JST基準）
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const EMPTY_STATES = {
  team: {
    imgSrc: MLB_LOGO,
    title: "No favorite team yet",
    desc: "Choose a favorite team to see its summary here.",
    action: { label: "Choose Team", to: "/onboarding/team" },
  },
  favorites: {
    Icon: Star,
    title: "No favorite players yet",
    desc: "Search for players and save them to your list.",
    action: { label: "Search Players", to: "/search" },
  },
  recommendations: {
    Icon: Bot,
    title: "No recommendations yet",
    desc: "Save more favorites to unlock personalized picks.",
    action: { label: "Find Players", to: "/search" },
  },
};

const MLB_ICON_IMG = ({ size = 36 }) => (
  <img src={MLB_LOGO} alt="MLB" width={size} height={size} style={{ opacity: 0.5 }} />
);

function EmptyState({ config }) {
  const { Icon, imgSrc } = config;
  return (
    <div className="home-empty-state">
      <span className="empty-state-icon">
        {imgSrc && <img src={imgSrc} alt="" width={36} height={36} style={{ opacity: 0.5 }} />}
        {Icon && !imgSrc && <Icon size={36} strokeWidth={1.5} />}
      </span>
      <p className="empty-state-title">{config.title}</p>
      <p className="empty-state-desc">{config.desc}</p>
      <Link className="home-link secondary" to={config.action.to}>
        {config.action.label}
      </Link>
    </div>
  );
}

function ArchetypeGrid() {
  return (
    <div className="arch-grid">
      {ARCHETYPES.map(({ slug, label, desc, color }) => (
        <Link key={slug} to={`/archetype/${slug}`} className="arch-tile">
          <span className="arch-tile-dot" style={{ background: color }} />
          <span className="arch-tile-name">{label}</span>
          <span className="arch-tile-desc">{desc}</span>
          <span className="arch-tile-arrow">→</span>
        </Link>
      ))}
    </div>
  );
}

function SectionHeading({ title, desc, count, viewAllTo }) {
  return (
    <div className="section-heading-row">
      <div className="section-heading">
        <h2>
          {title}
          {count > 0 && <span className="count-badge">{count}</span>}
        </h2>
        <p>{desc}</p>
      </div>
      {viewAllTo && (
        <Link className="view-all-link" to={viewAllTo}>
          View All →
        </Link>
      )}
    </div>
  );
}

// ── クイックアクション（横ストリップ） ──────────────────────────────────────
function HomeQuickStrip({ favoriteTeamId }) {
  const actions = favoriteTeamId
    ? [{ to: `/team/${favoriteTeamId}`, Icon: Shield, label: "My Team" }, ...QUICK_ACTIONS]
    : QUICK_ACTIONS;

  return (
    <div className="home-quick-strip">
      {actions.map((a) => (
        <Link key={a.to} to={a.to} className="home-strip-action">
          <span className="home-strip-icon">
            <a.Icon size={16} strokeWidth={2} />
          </span>
          <span className="home-strip-label">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}

// ── My Team ダッシュボード（2カラム: 案A×B ハイブリッド） ─────────────────────
// 左: 成績スタッツ / 右: 次の試合（または直近結果）
function TeamDashboard({ team, lastGame, nextGame }) {
  const record = team.record;

  // 表示する試合: 次の試合を優先、なければ直近結果
  const featuredGame = nextGame || lastGame;
  const gameLabel = nextGame ? "Next Game" : "Last Game";

  return (
    <div className="team-dashboard">
      {/* 左: 成績 */}
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

      {/* 右: 次の試合 / 直近結果 */}
      {featuredGame && (
        <div className="team-dashboard-right">
          <span className="team-game-label">{gameLabel}</span>
          {featuredGame.abstractState === "Preview" ? (
            // 未来の試合: スコアなし → 日時を大きく見せる
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
            // 終了試合: ScoreCard を流用
            <ScoreCard game={featuredGame} />
          )}
        </div>
      )}
    </div>
  );
}

function HomePage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamSchedule, setTeamSchedule] = useState([]);
  const [todayGames, setTodayGames] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [teamRef, teamVisible] = useReveal();
  const [todayRef, todayVisible] = useReveal();
  const [favRef, favVisible] = useReveal();
  const [recRef, recVisible] = useReveal();
  const [archetypeRef, archetypeVisible] = useReveal();
  const token = getAuthToken();

  // 個人化データ（ユーザー・お気に入り・おすすめ・My Team サマリー）をまとめて取得
  useEffect(() => {
    const fetchPersonalizedHome = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setErrorMessage("");

        const currentUser = await getCurrentUser(token);
        const [favoritePlayers, recommendedPlayers] = await Promise.all([
          getFavorites(token),
          getRecommendations(token),
        ]);

        setUser(currentUser);
        setFavorites(favoritePlayers.slice(0, 6));
        setRecommendations(recommendedPlayers);

        // My Team サマリー用に「基本情報＋成績」と「日程」を取得
        if (currentUser.favoriteTeam?.id) {
          const [teamData, scheduleData] = await Promise.all([
            getTeam(currentUser.favoriteTeam.id),
            getTeamSchedule(currentUser.favoriteTeam.id),
          ]);
          setTeamInfo(teamData);
          setTeamSchedule(scheduleData.games);
        }
      } catch (error) {
        console.error("Home personalization error:", error);
        if (isUnauthorizedError(error)) {
          clearAuthData();
          setErrorMessage("Your login session expired. Please login again.");
          return;
        }
        setErrorMessage(
          getApiErrorMessage(error, "Failed to load personalized home data."),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalizedHome();
  }, [token]);

  // 案2: Today's MLB は個人化と独立。失敗してもホーム全体を壊さないよう別 effect。
  useEffect(() => {
    if (!token) return;
    let active = true;
    const fetchTodayScores = async () => {
      try {
        const data = await getScores(mlbToday());
        if (active) setTodayGames(data.games);
      } catch {
        // Today's MLB は補助的なので失敗は黙って無視（セクションを出さないだけ）
      }
    };
    fetchTodayScores();
    return () => {
      active = false;
    };
  }, [token]);

  // 日程から「直近の結果」と「次の試合」を導出（API は日付昇順で返す）
  const { lastGame, nextGame } = useMemo(() => {
    const finals = teamSchedule.filter((g) => g.abstractState === "Final");
    const upcoming = teamSchedule.filter((g) => g.abstractState !== "Final");
    return {
      lastGame: finals.length ? finals[finals.length - 1] : null,
      nextGame: upcoming.length ? upcoming[0] : null,
    };
  }, [teamSchedule]);

  const renderPlayerGrid = (players, skeletonCount, emptyConfig) => {
    if (loading) {
      return (
        <div className="player-list">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (players.length === 0) {
      return <EmptyState config={emptyConfig} />;
    }

    return (
      <div className="player-list">
        {players.map((player) => (
          <PlayerCard
            key={player.playerId || player.mlbPlayerId}
            player={player}
          />
        ))}
      </div>
    );
  };

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

          {/* 右側: MLB ロゴ（デスクトップのみ表示） */}
          <div className="guest-hero-visual" aria-hidden="true">
            <img
              src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg"
              alt=""
              className="guest-hero-logo"
            />
          </div>
        </section>

        {/* Scout ヒーローカード: 目玉機能として guest view にも配置 */}
        <section className="scout-hero-card guest-scout-hero">
          <div className="scout-hero-left">
            <span className="scout-hero-kicker">
              <Telescope size={14} strokeWidth={2.5} />
              Featured
            </span>
            <h2 className="scout-hero-title">Player Scouting Report</h2>
            <p className="scout-hero-desc">
              Compare any MLB player's batting profile against the top 200 hitters. Strengths, weaknesses, and comparable players — all in one report.
            </p>
            <Link to="/scout" className="scout-hero-btn">
              Try Scout →
            </Link>
          </div>
          <Telescope size={64} strokeWidth={0.8} className="scout-hero-icon" />
        </section>

        <div className="feature-cards guest-feature-cards">
          <div className="feature-card">
            <span className="feature-card-icon"><Search size={24} strokeWidth={1.5} /></span>
            <h3>Search</h3>
            <p>Search any MLB player from the official Stats API in real time.</p>
          </div>
          <div className="feature-card">
            <span className="feature-card-icon"><Star size={24} strokeWidth={1.5} /></span>
            <h3>Track</h3>
            <p>Save favorite players with personal notes and tags to MongoDB.</p>
          </div>
          <div className="feature-card">
            <span className="feature-card-icon"><Bot size={24} strokeWidth={1.5} /></span>
            <h3>Discover</h3>
            <p>Get personalized recommendations based on your favorites.</p>
          </div>
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
      {/* ── チームカラーバナー（案A）──────────────────────────────────────────
          チーム色を背景に敷き、右にロゴを透かして「自分のチームのHome」感を出す。
          成績・次の試合をバナー内に収め、スクロールなしで朝刊的に把握できる（案B）。 */}
      <section
        className="home-banner"
        style={{ "--team-color": teamColor }}
      >
        {/* 背景: チームロゴの透かし */}
        {user?.favoriteTeam?.id && (
          <img
            src={`https://www.mlbstatic.com/team-logos/${user.favoriteTeam.id}.svg`}
            alt=""
            aria-hidden="true"
            className="home-banner-watermark"
          />
        )}

        <div className="home-banner-content">
          {/* あいさつ + 名前 */}
          <p className="home-banner-greeting">
            {getGreeting()}{user?.name ? `, ${user.name}` : ""}
          </p>

          {/* チーム名 + 成績（バナー内2カラム: 案B） */}
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

              {/* 次の試合 / 直近結果をバナー右に */}
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
              <Link className="home-link" to="/onboarding/team">
                Complete Onboarding
              </Link>
            </div>
          )}
        </div>

      </section>

      {errorMessage && <p className="error-message px-6">{errorMessage}</p>}

      <div className="home-content px-6">
        {/* Scout ヒーローカード: 目玉機能として最上部に配置 */}
        <section className="scout-hero-card">
          <div className="scout-hero-left">
            <span className="scout-hero-kicker">
              <Telescope size={14} strokeWidth={2.5} />
              Featured
            </span>
            <h2 className="scout-hero-title">Player Scouting Report</h2>
            <p className="scout-hero-desc">
              Compare any MLB player's batting profile against the top 200 hitters. Strengths, weaknesses, and comparable players — all in one report.
            </p>
            <Link to="/scout" className="scout-hero-btn">
              Scout a Player →
            </Link>
          </div>
          <Telescope size={64} strokeWidth={0.8} className="scout-hero-icon" />
        </section>

        {/* My Team: 2カラムダッシュボード（案B） */}
        <section
          ref={teamRef}
          className={`home-player-section home-team-section reveal${teamVisible ? " visible" : ""}`}
        >
          <SectionHeading
            title="Your Favorite Team"
            desc={
              user?.favoriteTeam?.name
                ? `${user.favoriteTeam.name} — record and upcoming games.`
                : "Choose a favorite team to show its summary here."
            }
            viewAllTo={
              user?.favoriteTeam?.id ? `/team/${user.favoriteTeam.id}` : undefined
            }
          />
          {loading ? (
            <div className="player-list-carousel">
              {Array.from({ length: SKELETON_COUNTS.team }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : user?.favoriteTeam?.id && teamInfo ? (
            <TeamDashboard
              team={teamInfo}
              lastGame={lastGame}
              nextGame={nextGame}
            />
          ) : (
            <EmptyState config={EMPTY_STATES.team} />
          )}
        </section>

        {/* 案2: Today's MLB */}
        {todayGames.length > 0 && (
          <section
            ref={todayRef}
            className={`home-player-section reveal reveal-delay-1${todayVisible ? " visible" : ""}`}
          >
            <SectionHeading
              title="Today's MLB"
              desc="Scores from around the league."
              count={todayGames.length}
              viewAllTo="/league"
            />
            <div className="scores-grid">
              {todayGames.slice(0, 6).map((g) => (
                <ScoreCard key={g.gamePk} game={g} />
              ))}
            </div>
          </section>
        )}

        {/* お気に入り選手 */}
        <section
          ref={favRef}
          className={`home-player-section home-favorites-section reveal reveal-delay-1${favVisible ? " visible" : ""}`}
        >
          <SectionHeading
            title="Your Favorite Players"
            desc="Players saved from Search, Detail, or Onboarding."
            count={favorites.length}
            viewAllTo="/favorites"
          />
          {renderPlayerGrid(
            favorites,
            SKELETON_COUNTS.favorites,
            EMPTY_STATES.favorites,
          )}
        </section>

        {/* おすすめ */}
        <section
          ref={recRef}
          className={`home-player-section home-recommendations-section reveal reveal-delay-2${recVisible ? " visible" : ""}`}
        >
          <SectionHeading
            title="Recommended For You"
            desc="Recommended from your favorite team, current stats, and saved players."
            count={recommendations.length}
            viewAllTo="/recommendations"
          />
          {renderPlayerGrid(
            recommendations,
            SKELETON_COUNTS.recommendations,
            EMPTY_STATES.recommendations,
          )}
        </section>

        {/* アーキタイプ一覧 */}
        <section
          ref={archetypeRef}
          className={`home-player-section reveal reveal-delay-3${archetypeVisible ? " visible" : ""}`}
        >
          <SectionHeading
            title="Browse by Archetype"
            desc="Players classified by playing style using ML clustering."
          />
          <ArchetypeGrid />
        </section>
      </div>
    </div>
  );
}

export default HomePage;
