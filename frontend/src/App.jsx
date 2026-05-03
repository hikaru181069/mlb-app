import { Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import PlayersPage from "./pages/PlayersPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import AddPlayerPage from "./pages/AddPlayerPage";
import EditPlayerPage from "./pages/EditPlayerPage";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/players" element={<PlayersPage />} />
      <Route path="/players/new" element={<AddPlayerPage />} />
      <Route path="/players/:id/edit" element={<EditPlayerPage />} />
      <Route path="/players/:id" element={<PlayerDetailPage />} />
    </Routes>
  );
}

export default App;
