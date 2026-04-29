import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PlayerCard from "../components/PlayerCard";
import SearchInput from "../components/SearchInput";
import FilterControls from "../components/FilterControls";

function PlayersPage() {
  const [searchText, setSearchText] = useState("");
  const [players, setPlayers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("name");
  const [teamFilter, setTeamFilter] = useState("All");
  const [positionFilter, setPositionFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

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

  let filteredPlayers = [...players];

  if (teamFilter !== "All") {
    filteredPlayers = filteredPlayers.filter(
      (player) => player.team === teamFilter,
    );
  }

  if (positionFilter !== "All") {
    filteredPlayers = filteredPlayers.filter(
      (player) => player.position === positionFilter,
    );
  }

  if (typeFilter !== "All") {
    filteredPlayers = filteredPlayers.filter(
      (player) => player.playerType === typeFilter,
    );
  }

  const sortedPlayers = filteredPlayers.sort((a, b) => {
    if (sortType === "name") {
      return a.name.localeCompare(b.name);
    }

    if (sortType === "homeRuns") {
      return (b.hitterStats?.homeRuns || 0) - (a.hitterStats?.homeRuns || 0);
    }

    if (sortType === "battingAverage") {
      return (
        Number(b.hitterStats?.battingAverage || 0) -
        Number(a.hitterStats?.battingAverage || 0)
      );
    }

    if (sortType === "era") {
      return (
        Number(a.pitcherStats?.era || 999) - Number(b.pitcherStats?.era || 999) //打者にはERAがないため打者が上に来るのを防ぐため999
      );
    }

    if (sortType === "strikeouts") {
      return (
        (b.pitcherStats?.strikeouts || 0) - (a.pitcherStats?.strikeouts || 0)
      );
    }

    return 0;
  });

  const handleResetFilters = () => {
    setSearchText("");
    setTypeFilter("All");
    setSortType("name");
    setTeamFilter("All");
    setPositionFilter("All");
  };

  return (
    <div className="app">
      <h1>MLB Player Search App</h1>
      <p className="description">Search by player name, team, or position</p>
      <Link className="add-player-link" to="/players/new">
        Add Player
      </Link>
      <SearchInput searchText={searchText} setSearchText={setSearchText} />

      <FilterControls
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        sortType={sortType}
        setSortType={setSortType}
        teamFilter={teamFilter}
        setTeamFilter={setTeamFilter}
        positionFilter={positionFilter}
        setPositionFilter={setPositionFilter}
        handleResetFilters={handleResetFilters}
      />
      {loading && <p className="status-message">Loading...</p>}
      {!loading && errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {!loading && !errorMessage && sortedPlayers.length === 0 && (
        <p className="status-message">No players found.</p>
      )}
      {!loading && !errorMessage && sortedPlayers.length > 0 && (
        <p className="status-message">
          {sortedPlayers.length}{" "}
          {sortedPlayers.length === 1 ? "player" : "players"} found
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
