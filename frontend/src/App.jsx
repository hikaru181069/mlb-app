import { Route, Routes, useLocation } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import "./App.css";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import PlayersPage from "./pages/PlayersPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import AddPlayerPage from "./pages/AddPlayerPage";
import EditPlayerPage from "./pages/EditPlayerPage";
import LoginPage from "./pages/LoginPage";
import ExternalPlayersPage from "./pages/ExternalPlayersPage";
import SearchPage from "./pages/SearchPage";
import FavoritesPage from "./pages/FavoritesPage";
import FavoriteEditPage from "./pages/FavoriteEditPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingFavoritesPage from "./pages/OnboardingFavoritesPage";
import TeamPage from "./pages/TeamPage";
import GamePage from "./pages/GamePage";
import NewsPage from "./pages/NewsPage";
import BottomTabBar from "./components/BottomTabBar";
import StatsPage from "./pages/StatsPage";
import ComparePage from "./pages/ComparePage";
import MatchupPage from "./pages/MatchupPage";
import LeaguePage from "./pages/LeaguePage";
import ProfilePage from "./pages/ProfilePage";
import RecommendationsPage from "./pages/RecommendationsPage";
import ScoutPage from "./pages/ScoutPage";
import ArchetypePage from "./pages/ArchetypePage";
import ProspectsPage from "./pages/ProspectsPage";
import ForYouPage from "./pages/ForYouPage";

// [Phase 4] ページ遷移アニメーション
// location.key を React の key に渡すことで、ページが変わるたびにコンポーネントが
// 再マウントされ、CSS アニメーション (page-transition) が毎回リセットされる。
// Navbar は AnimatedRoutes の外にあるため、ナビ時にちらつかない。
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.key} className="page-transition">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/favorites/:favoriteId" element={<FavoriteEditPage />} />
        <Route path="/team/:teamId" element={<TeamPage />} />
        <Route path="/game/:gamePk" element={<GamePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/matchup" element={<MatchupPage />} />
        <Route path="/league" element={<LeaguePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/scout" element={<ScoutPage />} />
        <Route path="/scout/:playerId" element={<ScoutPage />} />
        <Route path="/onboarding/favorites" element={<OnboardingFavoritesPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/external-players" element={<ExternalPlayersPage />} />
        <Route path="/players/new" element={<AddPlayerPage />} />
        <Route path="/players/:id/edit" element={<EditPlayerPage />} />
        <Route path="/players/:playerId" element={<PlayerDetailPage />} />
        <Route path="/archetype/:type" element={<ArchetypePage />} />
        <Route path="/prospects" element={<ProspectsPage />} />
        <Route path="/foryou" element={<ForYouPage />} />
      </Routes>
    </div>
  );
}

// [Phase 14] Footer
// fantinel.dev 参考: 技術スタック・作者情報をコンパクトにまとめたフッター。
// サイドバーと同じ ml-52 オフセットを適用してコンテンツ幅に揃える。
function Footer() {
  const techStack = ["MongoDB", "Express", "React", "Node.js", "FastAPI", "MLB Stats API", "JWT"];
  return (
    <footer className="site-footer md:ml-52">
      <div className="footer-inner">
        {/* 左: ロゴ + キャッチコピー */}
        <div className="footer-brand">
          <img
            src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg"
            alt="MLB"
            className="footer-logo"
          />
          <span className="footer-title">MLB App</span>
        </div>

        {/* 中央: 技術スタックバッジ */}
        <div className="footer-stack">
          {techStack.map((tech) => (
            <span key={tech} className="footer-badge">{tech}</span>
          ))}
        </div>

        {/* 右: クレジット */}
        <p className="footer-credit">
          Built by Hikaru · MERN Portfolio
        </p>
      </div>
    </footer>
  );
}

function App() {
  return (
    // [Phase 5] ToastProvider でアプリ全体をラップ
    // Navbar も内側に入れることで、Navbar 内でも useToast() が使える
    <ToastProvider>
      {/* [Phase 6] Navbar は左サイドバーとして固定表示される */}
      <Navbar />
      {/* pt-14: モバイル時のトップバー(56px)分を上に確保
          md:pt-0 md:ml-52: デスクトップではサイドバー幅(208px)分だけ右にオフセット */}
      {/* pb-16: モバイルで下部タブバー(64px)に隠れないようにオフセット */}
      <main className="pt-14 pb-16 md:pt-0 md:pb-0 md:ml-52">
        <AnimatedRoutes />
      </main>
      <BottomTabBar />
      <Footer />
    </ToastProvider>
  );
}

export default App;
