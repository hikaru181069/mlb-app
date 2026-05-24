import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ExternalPlayerCard from "../components/ExternalPlayerCard";
import SkeletonCard from "../components/SkeletonCard";
import { getAuthToken } from "../utils/authStorage";
import { getFavorites } from "../services/api/favoriteApi";
import { searchExternalPlayers as fetchExternalPlayers } from "../services/api/externalPlayerApi";

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
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
    if (searchText.trim()) {
      setSearchParams({ keyword: searchText.trim() });
    } else {
      handleSearchExternalPlayers(searchText);
    }
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
    <div className="home-page px-6 py-12">

      {/* Search Hero */}
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">MLB Stats API</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          Search Players
        </h1>
        <p className="home-description mt-4 text-base">
          Search any MLB player by name from the official Stats API.
        </p>

        <form className="mt-6 mx-auto flex w-full max-w-lg gap-3" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="e.g. Shohei Ohtani"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ margin: 0 }}
            className="flex-1 rounded-full border border-ctp-surface1 bg-ctp-surface0/70 px-5 py-2.5 text-base text-ctp-text placeholder:text-ctp-subtext0/60 transition-all duration-200 focus:border-ctp-sapphire focus:ring-2 focus:ring-ctp-sapphire/20 focus:outline-none"
          />
          <button
            className="home-link flex-shrink-0"
            type="submit"
            disabled={loading}
          >
            Search
          </button>
        </form>
      </section>

      {/* Results */}
      <div className="home-content mt-2">

        {/* Status messages */}
        {!loading && errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}

        {!loading && !errorMessage && players.length > 0 && (
          <p className="status-message">
            <span className="count-badge count-badge--leading">
              {players.length}
            </span>
            {players.length === 1 ? "player" : "players"} found
          </p>
        )}

        {!loading && !errorMessage && hasSearched && players.length === 0 && (
          <div className="home-empty-state">
            <span className="empty-state-icon">🔍</span>
            <p className="empty-state-title">No players found</p>
            <p className="empty-state-desc">
              Try a different name or check the spelling.
            </p>
          </div>
        )}

        {/* Skeleton or results grid */}
        {loading ? (
          <div className="player-list">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="player-list">
            {players.map((player) => (
              <ExternalPlayerCard
                key={player.externalId}
                player={player}
                alreadySaved={isAlreadySaved(player)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default SearchPage;
