import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppNav from "../components/AppNav";
import ExternalPlayerCard from "../components/ExternalPlayerCard";
import { getAuthToken } from "../utils/authStorage";
import { getFavorites } from "../services/api/favoriteApi";
import { searchExternalPlayers as fetchExternalPlayers } from "../services/api/externalPlayerApi";

function SearchPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const [searchText, setSearchText] = useState(keyword);
  const [players, setPlayers] = useState([]);
  const [savedPlayers, setSavedPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchExternalPlayers = async (nextSearchText) => {
    if (!nextSearchText.trim()) {
      setPlayers([]);
      setErrorMessage("Please enter a player name.");
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const token = getAuthToken();
      const data = await fetchExternalPlayers(nextSearchText);
      const savedPlayersData = token ? await getFavorites(token) : [];

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
      handleSearchExternalPlayers(keyword);
    }
  }, [keyword]);

  const handleSearch = (event) => {
    event.preventDefault();
    handleSearchExternalPlayers(searchText);
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
            />
          );
        })}
      </div>
    </div>
  );
}

export default SearchPage;
