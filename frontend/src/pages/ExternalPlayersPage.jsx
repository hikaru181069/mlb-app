import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ExternalPlayerCard from "../components/ExternalPlayerCard";
import { API_URL } from "../utils/apiConfig";

function ExternalPlayersPage() {
  const [searchText, setSearchText] = useState("");
  const [players, setPlayers] = useState([]);
  const [savedPlayers, setSavedPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (event) => {
    event.preventDefault();

    if (!searchText.trim()) {
      setPlayers([]);
      setErrorMessage("Please enter a player name.");
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `${API_URL}/api/external/players/search?q=${encodeURIComponent(
          searchText,
        )}`,
      );
      const savedPlayersResponse = await fetch(`${API_URL}/api/players`);

      const data = await response.json();
      const savedPlayersData = savedPlayersResponse.ok
        ? await savedPlayersResponse.json()
        : [];

      if (!response.ok) {
        throw new Error(data.message || "Failed to search external players.");
      }

      setPlayers(data);
      setSavedPlayers(savedPlayersData);
      setHasSearched(true);
    } catch (error) {
      console.error("External player search error:", error);
      setPlayers([]);
      setErrorMessage("Failed to search external players.");
    } finally {
      setLoading(false);
    }
  };

  const handleUsePlayer = (player) => {
    const normalizedPosition =
      player.position === "Two-Way Player"
        ? "Designated Hitter"
        : player.position;

    navigate("/players/new", {
      state: {
        externalPlayer: {
          name: player.name,
          team: player.team === "Unknown" ? "" : player.team,
          position: normalizedPosition === "Unknown" ? "" : normalizedPosition,
          image: player.image,
          externalId: player.externalId,
          playerType: player.playerType,
          hitterStats: player.hitterStats || {
            battingAverage: "",
            homeRuns: "",
            rbis: "",
          },
          pitcherStats: player.pitcherStats || {
            era: "",
            strikeouts: "",
            inningsPitched: "",
          },
          source: "MLB Stats API",
        },
      },
    });
  };

  const isAlreadySaved = (player) => {
    return savedPlayers.some((savedPlayer) => {
      if (savedPlayer.externalId && player.externalId) {
        return savedPlayer.externalId === player.externalId;
      }

      return savedPlayer.name.toLowerCase() === player.name.toLowerCase();
    });
  };

  return (
    <div className="app">
      <div className="top-actions">
        <Link className="back-link" to="/">
          ← Back to Home
        </Link>
      </div>

      <h1>External MLB Player Search</h1>
      <p className="description">
        Search player information from the MLB Stats API.
      </p>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search external player name"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <button
          className="add-player-link inline-flex items-center justify-center transition duration-200 hover:-translate-y-0.5"
          type="submit"
        >
          Search MLB API
        </button>
      </form>

      {loading && <p className="status-message">Loading...</p>}
      {!loading && errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}
      {!loading && !errorMessage && players.length > 0 && (
        <p className="status-message">
          {players.length} {players.length === 1 ? "player" : "players"} found
        </p>
      )}
      {!loading && !errorMessage && hasSearched && players.length === 0 && (
        <p className="status-message">No external players found.</p>
      )}

      <div className="player-list">
        {players.map((player) => {
          const alreadySaved = isAlreadySaved(player);

          return (
            <ExternalPlayerCard
              key={player.externalId}
              player={player}
              alreadySaved={alreadySaved}
              handleUsePlayer={handleUsePlayer}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ExternalPlayersPage;
