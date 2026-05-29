import { Route, Routes } from "react-router-dom";
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
import OnboardingTeamPage from "./pages/OnboardingTeamPage";
import OnboardingFavoritesPage from "./pages/OnboardingFavoritesPage";
import TeamRosterPage from "./pages/TeamRosterPage";
import StatsPage from "./pages/StatsPage";
import ComparePage from "./pages/ComparePage";

function App() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/favorites/:favoriteId" element={<FavoriteEditPage />} />
          <Route path="/team-roster" element={<TeamRosterPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/onboarding/team" element={<OnboardingTeamPage />} />
          <Route
            path="/onboarding/favorites"
            element={<OnboardingFavoritesPage />}
          />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/external-players" element={<ExternalPlayersPage />} />
          <Route path="/players/new" element={<AddPlayerPage />} />
          <Route path="/players/:id/edit" element={<EditPlayerPage />} />
          <Route path="/players/:playerId" element={<PlayerDetailPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
