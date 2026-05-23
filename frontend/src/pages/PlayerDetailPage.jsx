import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [similarPlayers, setSimilarPlayers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [favoriteRecord, setFavoriteRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = getAuthToken();
  const backPath = location.state?.from || "/search";
  const backLabel = location.state?.fromLabel || "Back to Search";

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
      <div className="home-page px-6 py-12">
        <div className="player-detail mx-auto w-full max-w-4xl animate-pulse">
          {/* Hero: 縦中央揃えのレイアウトに合わせる */}
          <div className="detail-hero">
            <div
              className="rounded-[10%] bg-ctp-surface1"
              style={{ width: "min(100%, 360px)", height: "480px" }}
            />
            <div className="detail-hero-copy">
              <div className="mx-auto h-9 w-2/3 rounded-md bg-ctp-surface1" />
              <div className="mx-auto flex gap-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="h-3 w-14 rounded bg-ctp-surface1" />
                    <div className="h-5 w-20 rounded bg-ctp-surface1" />
                  </div>
                ))}
              </div>
              <div className="mx-auto h-11 w-44 rounded-full bg-ctp-surface1" />
            </div>
          </div>

          {/* Stats: 2列グリッド */}
          <div className="detail-stats-grid">
            {[0, 1].map((i) => (
              <div key={i} className="detail-section flex flex-col gap-3">
                <div className="h-5 w-40 rounded bg-ctp-surface1" />
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-4 w-full rounded bg-ctp-surface1" />
                ))}
              </div>
            ))}
          </div>

          {/* Last 5 Games */}
          <div className="detail-section flex flex-col gap-3">
            <div className="h-5 w-32 rounded bg-ctp-surface1" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 w-full rounded bg-ctp-surface1" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="home-page px-6 py-12">
        <p className="error-message">{errorMessage}</p>
        <div className="home-actions">
          <Link className="home-link secondary" to="/">
            ← Back to Home
          </Link>
        </div>
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
    <div className="home-page px-6 py-12">
      <div className="detail-actions">
        <Link className="detail-nav-link" to={backPath}>
          ← {backLabel}
        </Link>
      </div>

      <div className="player-detail mx-auto mt-8 w-full max-w-4xl">
        <section className="detail-hero">
          {displayImage && (
            <div
              className="player-image-wrapper transition duration-200 hover:scale-[1.02]"
              style={{ width: "min(100%, 360px)", height: "480px" }}
            >
              <img
                className="player-image"
                src={displayImage}
                alt={displayName}
              />
            </div>
          )}

          <div className="detail-hero-copy">
            {player.source && player.source !== "Manual" && (
              <p className="source-badge">{player.source}</p>
            )}
            <h1>{displayName}</h1>
            <dl className="detail-meta-list">
              <div>
                <dt>Team</dt>
                <dd>{displayTeam || "Unknown"}</dd>
              </div>
              <div>
                <dt>Position</dt>
                <dd>{player.position || "Unknown"}</dd>
              </div>
              <div>
                <dt>Player Type</dt>
                <dd>{player.playerType || "Unknown"}</dd>
              </div>
            </dl>
            {player.shortBio && <p className="detail-bio">{player.shortBio}</p>}

            <div className="home-actions">
              <button
                className={`home-link${favoriteRecord ? " secondary" : ""}`}
                type="button"
                disabled={Boolean(favoriteRecord)}
                onClick={handleAddToFavorites}
              >
                {favoriteRecord ? "✓ Already in Favorites" : "Add to Favorites"}
              </button>

              {player.baseballSavantUrl && (
                <a
                  className="home-link secondary"
                  href={player.baseballSavantUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Baseball Savant ↗
                </a>
              )}
            </div>

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

        <div className="detail-stats-grid">
          <section className="detail-section">
            <h2>Current Season Stats</h2>
            <PlayerStats player={currentSeasonStats} />
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
