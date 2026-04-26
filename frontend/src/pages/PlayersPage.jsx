import { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";
import SearchInput from "../components/SearchInput";

function PlayersPage() {
  const [searchText, setSearchText] = useState("");
  const [players, setPlayers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        let url;
        if (searchText) {
          url = `http://localhost:5001/api/players/search?q=${encodeURIComponent(searchText)}`;
        } else {
          url = "http://localhost:5001/api/players";
        }

        const response = await fetch(url);
        const data = await response.json();
        setPlayers(data);
        setErrorMessage("");
      } catch (error) {
        console.error("Fetch players error:", error);
        setPlayers([]);
        setErrorMessage("Failed to load players.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [searchText]);

return (
  <div className="app">
  <h1>MLB Player Search App</h1>
  <p className="description">Search players from MongoDB</p>
  <SearchInput searchText={searchText}
  setSearchText={setSearchText}/>
  {loading && <p className="status-message">Loading...</p>}
  {!loading && errorMessage && (<p className="error-message">{errorMessage}</p>)}
  {!loading && !errorMessage && players.length === 0 && (<p className="status-message">No players found.</p>)}

  <div className="player-list">
  {players.map((player) => (
    <PlayerCard key={player._id}
    player={player} />
  ))}
  </div>
  </div>
);
}

export default PlayersPage;














