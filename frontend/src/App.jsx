import { Route, Routes } from "react-router-dom";
import PlayersPage from "./pages/PlayersPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PlayersPage />} />
      <Route path="/players/:id" element={<PlayerDetailPage />} />
    </Routes>
  );
}

export default App;
