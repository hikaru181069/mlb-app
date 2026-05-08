import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import ExternalPlayerCard from "../components/ExternalPlayerCard";
import { API_URL } from "../utils/apiConfig";
import { getAuthToken } from "../utils/authStorage";

function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get("keyword") || "";
  const [searchText, setSearchText] = useState(keyword);
  const [players, setPlayers] = useState([]);
  const [savedPlayers, setSavedPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const searchExternalPlayers = async (nextSearchText) => {
    if (!nextSearchText.trim()) {
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
          nextSearchText,
        )}`,
      );
      const token = getAuthToken();
      const savedPlayersResponse = await fetch(`${API_URL}/api/favorites`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

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

  useEffect(() => {
    if (keyword) {
      searchExternalPlayers(keyword);
    }
  }, [keyword]);

  const handleSearch = (event) => {
    event.preventDefault();
    searchExternalPlayers(searchText);
  };

  const handleAddToFavorites = (player) => {
    const normalizedPosition =
      player.position === "Two-Way Player"
        ? "Designated Hitter"
        : player.position;

    navigate("/players/new", {
      state: {
        externalPlayer: {
          name: player.name,
          team: player.team || "Unknown",
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
          currentSeasonStats: player.currentSeasonStats,
          careerStats: player.careerStats,
          recentGames: player.recentGames || [],
          baseballSavantUrl: player.baseballSavantUrl || "",
          source: "MLB Stats API",
        },
      },
    });
  };

  const isAlreadySaved = (player) => {
    return savedPlayers.some((savedPlayer) => {
      if (savedPlayer.mlbPlayerId && player.externalId) {
        return savedPlayer.mlbPlayerId === player.externalId;
      }

      return savedPlayer.fullName.toLowerCase() === player.name.toLowerCase();
    });
  };

  return (
    <div className="app">
      <AppNav />

      <h1>Search MLB Players</h1>
      <p className="description">
        Search player information from the MLB Stats API.
      </p>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search MLB player name"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <button className="add-player-link" type="submit">
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
              handleAddToFavorites={handleAddToFavorites}
            />
          );
        })}
      </div>
    </div>
  );
}

export default SearchPage;
