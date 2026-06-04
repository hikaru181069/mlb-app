import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import PlayerCard from "../components/PlayerCard";
import SkeletonCard from "../components/SkeletonCard";
import ScoreCard from "../components/ScoreCard";
import { getFavorites } from "../services/api/favoriteApi";
import { getRecommendations } from "../services/api/recommendationApi";
import { getCurrentUser } from "../services/api/userApi";
import { getTeam, getTeamSchedule } from "../services/api/teamApi";
import { getScores } from "../services/api/leagueApi";
import { clearAuthData, getAuthToken } from "../utils/authStorage";
import {
  getApiErrorMessage,
  isUnauthorizedError,
} from "../services/api/apiError";
import { useReveal } from "../hooks/useReveal";

const SKELETON_COUNTS = { team: 2, favorites: 6, recommendations: 6, today: 4 };

// 案3: ホームを各機能の「ハブ」にするクイックアクション。
// My Team はお気に入りチームがある時だけ先頭に差し込む（下の QuickActions 内で対応）。
const QUICK_ACTIONS = [
  { to: "/search", icon: "🔍", label: "Search" },
  { to: "/league", icon: "🏆", label: "League" },
  { to: "/compare", icon: "⚖️", label: "Compare" },
  { to: "/matchup", icon: "⚔️", label: "Matchup" },
  { to: "/favorites", icon: "⭐", label: "Favorites" },
];

const EMPTY_STATES = {
  team: {
    icon: "⚾",
    title: "No favorite team yet",
    desc: "Choose a favorite team to see its summary here.",
    action: { label: "Choose Team", to: "/onboarding/team" },
  },
  favorites: {
    icon: "⭐",
    title: "No favorite players yet",
    desc: "Search for players and save them to your list.",
    action: { label: "Search Players", to: "/search" },
  },
  recommendations: {
    icon: "🤖",
    title: "No recommendations yet",
    desc: "Save more favorites to unlock personalized picks.",
    action: { label: "Find Players", to: "/search" },
  },
};

function EmptyState({ config }) {
  return (
    <div className="home-empty-state">
      <span className="empty-state-icon">{config.icon}</span>
      <p className="empty-state-title">{config.title}</p>
      <p className="empty-state-desc">{config.desc}</p>
      <Link className="home-link secondary" to={config.action.to}>
        {config.action.label}
      </Link>
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

// ── 案3: クイックアクション ───────────────────────────────────────────────────
function QuickActions({ favoriteTeamId }) {
  const actions = favoriteTeamId
    ? [{ to: `/team/${favoriteTeamId}`, icon: "🛡️", label: "My Team" }, ...QUICK_ACTIONS]
    : QUICK_ACTIONS;

  return (
    <div className="quick-actions">
      {actions.map((a) => (
        <Link key={a.to} to={a.to} className="quick-action">
          <span className="quick-action-icon">{a.icon}</span>
          <span className="quick-action-label">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}

// ── 案1: My Team サマリー ─────────────────────────────────────────────────────
// ラベル付きのミニ試合カード（Last / Next）
function TeamGame({ label, game }) {
  return (
    <div className="team-game">
      <span className="team-game-label">{label}</span>
      <ScoreCard game={game} />
    </div>
  );
}

function TeamSummary({ team, lastGame, nextGame }) {
  const record = team.record;

  return (
    <div className="team-summary">
      <div className="team-summary-head">
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
          <div className="team-stat-row">
            <div className="team-stat">
              <span className="team-stat-value">
                {record.wins}-{record.losses}
              </span>
              <span className="team-stat-label">Record</span>
            </div>
            <div className="team-stat">
              <span className="team-stat-value">#{record.divisionRank}</span>
              <span className="team-stat-label">Div Rank</span>
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

      {(lastGame || nextGame) && (
        <div className="team-summary-games">
          {lastGame && <TeamGame label="Last" game={lastGame} />}
          {nextGame && <TeamGame label="Next" game={nextGame} />}
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
        const data = await getScores();
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

        <div className="feature-cards guest-feature-cards">
          <div className="feature-card">
            <span className="feature-card-icon">🔍</span>
            <h3>Search</h3>
            <p>Search any MLB player from the official Stats API in real time.</p>
          </div>
          <div className="feature-card">
            <span className="feature-card-icon">⭐</span>
            <h3>Track</h3>
            <p>Save favorite players with personal notes and tags to MongoDB.</p>
          </div>
          <div className="feature-card">
            <span className="feature-card-icon">🤖</span>
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
  return (
    <div className="home-page px-6 py-12">
      {/* 案3: 圧縮したヒーロー（あいさつ + チーム chip + オンボーディング催促のみ） */}
      <section className="home-hero home-hero--compact w-full max-w-4xl px-8 py-8 md:px-14 md:py-10">
        <p className="home-kicker text-sm">Personalized Home</p>
        <h1 className="text-3xl leading-tight font-black tracking-tight md:text-5xl">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>

        {user?.favoriteTeam?.name && (
          <div className="player-card-team mt-4">
            {user.favoriteTeam.id && (
              <img
                src={`https://www.mlbstatic.com/team-logos/${user.favoriteTeam.id}.svg`}
                alt={user.favoriteTeam.name}
                style={{ width: "24px", height: "24px" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <span>{user.favoriteTeam.name}</span>
          </div>
        )}

        {user && !user.hasCompletedOnboarding && (
          <div className="home-onboarding-callout mt-6">
            <strong>Onboarding is not complete yet.</strong>
            <p>Choose your favorite team and at least 3 favorite players.</p>
            <Link className="home-link" to="/onboarding/team">
              Complete Onboarding
            </Link>
          </div>
        )}
      </section>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="home-content">
        {/* 案3: クイックアクション */}
        <section className="home-quick-section">
          <QuickActions favoriteTeamId={user?.favoriteTeam?.id} />
        </section>

        {/* 案1: My Team サマリー */}
        <section
          ref={teamRef}
          className={`home-player-section home-team-section reveal${teamVisible ? " visible" : ""}`}
        >
          <SectionHeading
            title="Your Favorite Team"
            desc={
              user?.favoriteTeam?.name
                ? `${user.favoriteTeam.name} — record, last and next game.`
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
            <TeamSummary
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
          />
          {renderPlayerGrid(
            recommendations,
            SKELETON_COUNTS.recommendations,
            EMPTY_STATES.recommendations,
          )}
        </section>
      </div>
    </div>
  );
}

export default HomePage;
