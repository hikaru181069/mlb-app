import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AppNav from "../components/AppNav";
import PlayerStats from "../components/PlayerStats";
import PlayerCard from "../components/PlayerCard";
import { getAuthToken } from "../utils/authStorage";
import { API_URL } from "../utils/apiConfig";
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
  const [loading, setLoading] = useState(false);

  const token = getAuthToken();

  useEffect(() => {
    const fetchExternalPlayerDetail = async (mlbPlayerId) => {
      const response = await fetch(
        `${API_URL}/api/external/players/${mlbPlayerId}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load external player.");
      }

      return data;
    };

    const fetchPlayer = async () => {
      try {
        setLoading(true);

        const localPlayer = getPlayerById(playerId);

        if (localPlayer) {
          const externalPlayer = await fetchExternalPlayerDetail(
            localPlayer.playerId,
          );
          setPlayer({
            ...localPlayer,
            ...externalPlayer,
          });
          setSimilarPlayers(getSimilarPlayers(playerId));
          setErrorMessage("");
          return;
        }

        const token = getAuthToken();
        const response = await fetch(`${API_URL}/api/favorites`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load player.");
        }

        const favoritePlayer = data.find(
          (favorite) => favorite._id === playerId,
        );

        if (!favoritePlayer) {
          throw new Error("Player not found.");
        }

        const externalPlayer = await fetchExternalPlayerDetail(
          favoritePlayer.mlbPlayerId,
        );

        setPlayer({
          ...favoritePlayer,
          ...externalPlayer,
        });
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

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this player?",
    );
    if (!confirmed) {
      return;
    }
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_URL}/api/players/${playerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete player.");
      }
      navigate("/players");
    } catch (error) {
      console.error("Delete player error:", error);
      setErrorMessage("Failed to delete player.");
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

  return (
    <div className="app">
      <AppNav />

      <div className="detail-actions">
        <Link className="back-link" to="/">
          ← Back to Home
        </Link>

        {token && (
          <>
            <Link className="edit-link" to={`/players/${playerId}/edit`}>
              Edit Player
            </Link>

            <button
              className="delete-button"
              type="button"
              onClick={handleDelete}
            >
              Delete Player
            </button>
          </>
        )}
      </div>

      <div className="player-detail mx-auto mt-8 w-full max-w-4xl">
        {(player.imageUrl || player.image) && (
          <img
            className="detail-image transition duration-200 hover:scale-[1.02]"
            src={player.imageUrl || player.image}
            alt={player.fullName || player.name}
          />
        )}

        <div className="space-y-3">
          <h1>{player.fullName || player.name}</h1>
          {player.source && player.source !== "Manual" && (
            <p className="source-badge">{player.source}</p>
          )}
          <p>Team: {player.teamName || player.team}</p>
          <p>Position: {player.position}</p>
          {player.shortBio && <p>{player.shortBio}</p>}

          <h2>Current Season Stats</h2>
          <PlayerStats player={currentSeasonStats} />

          <h2>Last 5 Games</h2>
          {recentGames.length > 0 ? (
            <div className="recent-games">
              {recentGames.map((game) => (
                <p key={`${game.date}-${game.opponent}`}>
                  {game.date} vs {game.opponent}: {game.summary} ({game.result})
                </p>
              ))}
            </div>
          ) : (
            <p>Recent game stats will be added later.</p>
          )}

          <h2>Career Stats</h2>
          <PlayerStats player={careerStats} />

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

          <button className="add-player-link" type="button">
            Add to Favorites
          </button>
        </div>
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
