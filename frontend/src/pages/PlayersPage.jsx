import { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";
import SearchInput from "../components/SearchInput";

function PlayersPage() {
  const [searchText, setSearchText] = useState("");
  const [players, setPlayers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("name");

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

  const sortedPlayers = [...players].sort((a, b) => {
    if (sortType === "name") {
      return a.name.localeCompare(b.name);
    }

    if (sortType === "homeRuns") {
      return b.stats.homeRuns - a.stats.homeRuns;
    }

    if (sortType === "battingAverage") {
      return Number(b.stats.battingAverage) - Number(a.stats.battingAverage);
    }

    return 0;
  });

  return (
    <div className="app">
      <h1>MLB Player Search App</h1>
      <p className="description">Search by player name, team, or position</p>
      <SearchInput searchText={searchText} setSearchText={setSearchText} />
      <select
        value={sortType}
        onChange={(event) => setSortType(event.target.value)}
      >
        <option value="name">Sort by name</option>
        <option value="homeRuns">Sort by home runs</option>
        <option value="battingAverage">Sort by batting average</option>
      </select>
      {loading && <p className="status-message">Loading...</p>}
      {!loading && errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {!loading && !errorMessage && players.length === 0 && (
        <p className="status-message">No players found.</p>
      )}

      {!loading && !errorMessage && players.length > 0 && (
        <p className="status-message">
          {players.length} {players.length === 1 ? "player" : "players"} found
        </p>
      )}

      <div className="player-list">
        {sortedPlayers.map((player) => (
          <PlayerCard key={player._id} player={player} />
        ))}
      </div>
    </div>
  );
}

export default PlayersPage;
