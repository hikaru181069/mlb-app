import { useEffect, useState } from "react";
import "./App.css";

function App() {
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

      <input
        type="text"
        placeholder="Search player name"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />

      {loading && <p className="status-message">Loading...</p>}
      {!loading && errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {!loading && !errorMessage && players.length === 0 && (
        <p className="status-message">No players found.</p>
      )}

      <div className="player-list">
        {players.map((player) => (
          <div className="player-card" key={player._id}>
            {player.image && (
              <img
                className="player-image"
                src={player.image}
                alt={player.name}
              />
            )}

            <h2>{player.name}</h2>
            <p>Team: {player.team}</p>
            <p>Position: {player.position}</p>

            {player.stats && (
              <div className="stats">
                <p>AVG: {player.stats.battingAverage}</p>
                <p>HR: {player.stats.homeRuns}</p>
                <p>RBI: {player.stats.rbis}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
