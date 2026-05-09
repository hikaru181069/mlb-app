import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AppNav from "../components/AppNav";
import PlayerStats from "../components/PlayerStats";
import PlayerCard from "../components/PlayerCard";
import { getAuthToken } from "../utils/authStorage";
import {
  createFavorite,
  getFavorites,
} from "../services/api/favoriteApi";
import { getExternalPlayerDetail } from "../services/api/externalPlayerApi";
import {
  getPlayerById,
  getSimilarPlayers,
} from "../services/playerDataService";

function PlayerDetailPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [similarPlayers, setSimilarPlayers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [favoriteRecord, setFavoriteRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = getAuthToken();

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        setFavoriteMessage("");
        setFavoriteRecord(null);
        const token = getAuthToken();
        const favoritePlayers = await getFavorites(token);
        const isExternalPlayerId = /^\d+$/.test(playerId);

        const localPlayer = getPlayerById(playerId);

        if (localPlayer) {
          const externalPlayer = await getExternalPlayerDetail(localPlayer.playerId);
          const savedFavorite = favoritePlayers.find(
            (favorite) => favorite.mlbPlayerId === localPlayer.playerId,
          );
          setPlayer({
            ...localPlayer,
            ...externalPlayer,
          });
          setFavoriteRecord(savedFavorite || null);
          setSimilarPlayers(getSimilarPlayers(playerId));
          setErrorMessage("");
          return;
        }

        if (isExternalPlayerId) {
          const externalPlayer = await getExternalPlayerDetail(playerId);
          const savedFavorite = favoritePlayers.find(
            (favorite) => favorite.mlbPlayerId === Number(playerId),
          );

          setPlayer(externalPlayer);
          setFavoriteRecord(savedFavorite || null);
          setSimilarPlayers([]);
          setErrorMessage("");
          return;
        }

        const favoritePlayer = favoritePlayers.find(
          (favorite) => favorite._id === playerId,
        );

        if (!favoritePlayer) {
          throw new Error("Player not found.");
        }

        const externalPlayer = await getExternalPlayerDetail(
          favoritePlayer.mlbPlayerId,
        );

        setPlayer({
          ...favoritePlayer,
          ...externalPlayer,
        });
        setFavoriteRecord(favoritePlayer);
        setSimilarPlayers([]);
        setErrorMessage("");
      } catch (error) {
        console.log("Fetch player error:", error);
        setPlayer(null);
        setErrorMessage("Failed to load player.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [playerId]);

  const handleAddToFavorites = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (favoriteRecord) {
      setFavoriteMessage("This player is already in your favorites.");
      return;
    }

    try {
      setFavoriteMessage("");
      const favorite = await createFavorite(player, token);
      setFavoriteRecord(favorite);
      setFavoriteMessage("Added to favorites.");
    } catch (error) {
      console.error("Add favorite error:", error);
      setFavoriteMessage(error.message || "Failed to add favorite.");
    }
  };

  if (loading) {
    return (
      <div className="app">
        <p className="status-message">Loading...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="app">
        <p className="error-message">{errorMessage}</p>
        <Link className="back-link" to="/players">
          ← Back to players
        </Link>
      </div>
    );
  }

  if (!player) {
    return null;
  }

  const currentSeasonStats = {
    playerType: player.playerType,
    hitterStats: player.currentSeasonStats?.hitterStats || player.hitterStats,
    pitcherStats:
      player.currentSeasonStats?.pitcherStats || player.pitcherStats,
  };
  const careerStats = {
    playerType: player.playerType,
    hitterStats: player.careerStats?.hitterStats,
    pitcherStats: player.careerStats?.pitcherStats,
  };
  const recentGames = player.recentGames || [];
  const displayName = player.fullName || player.name;
  const displayTeam =
    player.team && player.team !== "Unknown" ? player.team : player.teamName;
  const displayImage = player.imageUrl || player.image;
  const hasCareerStats =
    careerStats.hitterStats || careerStats.pitcherStats;

  return (
    <div className="app">
      <AppNav />

      <div className="detail-actions">
        <Link className="back-link" to="/">
          ← Back to Home
        </Link>

        <Link className="back-link" to="/search">
          Search Players
        </Link>
      </div>

      <div className="player-detail mx-auto mt-8 w-full max-w-4xl">
        <section className="detail-hero">
          {displayImage && (
            <img
              className="detail-image transition duration-200 hover:scale-[1.02]"
              src={displayImage}
              alt={displayName}
            />
          )}

          <div className="detail-hero-copy">
            {player.source && player.source !== "Manual" && (
              <p className="source-badge">{player.source}</p>
            )}
            <h1>{displayName}</h1>
            <div className="detail-meta-grid">
              <p>
                <span>Team</span>
                {displayTeam || "Unknown"}
              </p>
              <p>
                <span>Position</span>
                {player.position || "Unknown"}
              </p>
              <p>
                <span>Player Type</span>
                {player.playerType || "Unknown"}
              </p>
            </div>
            {player.shortBio && <p className="detail-bio">{player.shortBio}</p>}

            {player.baseballSavantUrl && (
              <a
                className="back-link"
                href={player.baseballSavantUrl}
                target="_blank"
                rel="noreferrer"
              >
                View on Baseball Savant
              </a>
            )}

            <button
              className="add-player-link"
              type="button"
              disabled={Boolean(favoriteRecord)}
              onClick={handleAddToFavorites}
            >
              {favoriteRecord ? "Already in Favorites" : "Add to Favorites"}
            </button>

            {favoriteMessage && (
              <p className="status-message">{favoriteMessage}</p>
            )}
          </div>
        </section>

        {(player.note || player.favoriteReason) && (
          <section className="detail-section favorite-note-section">
            <h2>My Favorite Memo</h2>
            {player.note && (
              <p>
                <strong>Note:</strong> {player.note}
              </p>
            )}
            {player.favoriteReason && (
              <p>
                <strong>Reason:</strong> {player.favoriteReason}
              </p>
            )}
          </section>
        )}

        <section className="detail-section">
          <h2>Current Season Stats</h2>
          <PlayerStats player={currentSeasonStats} />
        </section>

        <section className="detail-section">
          <h2>Last 5 Games</h2>
          {recentGames.length > 0 ? (
            <div className="recent-games">
              {recentGames.map((game) => (
                <p key={`${game.date}-${game.opponent}`}>
                  <span>{game.date}</span>
                  vs {game.opponent}: {game.summary} ({game.result})
                </p>
              ))}
            </div>
          ) : (
            <p>Recent game stats will be added later.</p>
          )}
        </section>

        <section className="detail-section">
          <h2>Career Stats</h2>
          {hasCareerStats ? (
            <PlayerStats player={careerStats} />
          ) : (
            <p>Career stats will be added later.</p>
          )}
        </section>
      </div>

      <section className="similar-players">
        <div className="section-heading">
          <h2>Similar Players</h2>
          <p>Recommendation data will later come from FastAPI.</p>
        </div>

        <div className="player-list">
          {similarPlayers.map((similarPlayer) => (
            <PlayerCard key={similarPlayer.playerId} player={similarPlayer} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default PlayerDetailPage;
