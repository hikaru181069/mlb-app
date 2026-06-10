import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import PlayerStats from "../components/PlayerStats";
import PlayerCard from "../components/PlayerCard";
import PlayerYearByYear from "../components/PlayerYearByYear";
import { getAuthToken } from "../utils/authStorage";
import {
  createFavorite,
  getFavorites,
} from "../services/api/favoriteApi";
import { getExternalPlayerDetail } from "../services/api/externalPlayerApi";
import { getPlayerById } from "../services/playerDataService";
import { getSimilarPlayers } from "../services/api/similarPlayerApi";
import { mlbTeams } from "../services/mlbTeams";
import { useReveal } from "../hooks/useReveal";
import { useToast } from "../contexts/ToastContext";


function PlayerDetailPage() {
  const { playerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [player, setPlayer] = useState(null);
  const [mlbSimilar, setMlbSimilar] = useState([]);
  const [youngSimilar, setYoungSimilar] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [favoriteRecord, setFavoriteRecord] = useState(null);
  const [statsRef, statsVisible] = useReveal();
  const [gamesRef, gamesVisible] = useReveal();
  const [similarRef, similarVisible] = useReveal();
  const [loading, setLoading] = useState(false);

  const token = getAuthToken();
  const backPath = location.state?.from || "/search";
  const backLabel = location.state?.fromLabel || "Back to Search";

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
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
          setPlayer({ ...localPlayer, ...externalPlayer });
          setFavoriteRecord(savedFavorite || null);
          setErrorMessage("");
          getSimilarPlayers(localPlayer.playerId).then(({ mlbSimilar = [], youngSimilar = [] }) => { setMlbSimilar(mlbSimilar); setYoungSimilar(youngSimilar); });
          return;
        }

        if (isExternalPlayerId) {
          const externalPlayer = await getExternalPlayerDetail(playerId);
          const savedFavorite = favoritePlayers.find(
            (favorite) => favorite.mlbPlayerId === Number(playerId),
          );
          setPlayer(externalPlayer);
          setFavoriteRecord(savedFavorite || null);
          setErrorMessage("");
          getSimilarPlayers(playerId).then(({ mlbSimilar = [], youngSimilar = [] }) => { setMlbSimilar(mlbSimilar); setYoungSimilar(youngSimilar); });
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
        setPlayer({ ...favoritePlayer, ...externalPlayer });
        setFavoriteRecord(favoritePlayer);
        setErrorMessage("");
        getSimilarPlayers(favoritePlayer.mlbPlayerId).then(({ mlbSimilar = [], youngSimilar = [] }) => { setMlbSimilar(mlbSimilar); setYoungSimilar(youngSimilar); });
      } catch (error) {
        console.error("Fetch player error:", error);
        setPlayer(null);
        setErrorMessage(error.message || "Failed to load player.");
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
      addToast("Already in your favorites.", "info");
      return;
    }

    try {
      const favorite = await createFavorite(player, token);
      setFavoriteRecord(favorite);
      addToast("Added to favorites!", "success");
    } catch (error) {
      console.error("Add favorite error:", error);
      addToast(error.message || "Failed to add favorite.", "error");
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
  const recentGames = player.recentGames || [];
  const displayName = player.fullName || player.name;
  const displayTeam =
    player.team && player.team !== "Unknown" ? player.team : player.teamName;
  const displayImage = player.imageUrl || player.image;
  const displayTeamId =
    player.teamId ??
    mlbTeams.find((t) => t.name.toLowerCase() === (displayTeam || "").toLowerCase())?.id;

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
            <div className="player-image-wrapper detail-hero-image transition duration-200 hover:scale-[1.02]">
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
                <dd className="flex items-center gap-2">
                  {displayTeamId && (
                    <img
                      src={`https://www.mlbstatic.com/team-logos/${displayTeamId}.svg`}
                      alt={displayTeam}
                      style={{ width: "20px", height: "20px" }}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                  {displayTeam || "Unknown"}
                </dd>
              </div>
              <div>
                <dt>Position</dt>
                <dd>{player.position || "Unknown"}</dd>
              </div>
              {player.height && (
                <div>
                  <dt>Height</dt>
                  <dd>{player.height}</dd>
                </div>
              )}
              {player.weight && (
                <div>
                  <dt>Weight</dt>
                  <dd>{player.weight} lbs</dd>
                </div>
              )}
            </dl>
            {player.shortBio && <p className="detail-bio">{player.shortBio}</p>}
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

        <section ref={statsRef} className={`detail-section reveal${statsVisible ? " visible" : ""}`}>
          <h2>Current Season Stats</h2>
          <PlayerStats player={currentSeasonStats} />
        </section>

        <section ref={gamesRef} className={`detail-section reveal reveal-delay-1${gamesVisible ? " visible" : ""}`}>
          <h2>Last 5 Games</h2>
          {recentGames.length > 0 ? (
            <div className="recent-games-table-wrap">
              <table className="recent-games-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Opponent</th>
                    <th>Result</th>
                    <th>Line</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGames.map((game) => (
                    <tr key={`${game.date}-${game.opponent}`}>
                      <td>{game.date}</td>
                      <td>vs {game.opponent}</td>
                      <td>
                        <span className={`game-result-badge game-result-badge--${game.result === "W" ? "win" : "loss"}`}>
                          {game.result}
                        </span>
                      </td>
                      <td>{game.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="detail-coming-soon">
              <img
                src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg"
                alt=""
                width={28}
                height={28}
                style={{ opacity: 0.5 }}
              />
              <p>No recent games available for this player.</p>
            </div>
          )}
        </section>

        {/* 年度別成績（データがあれば表示） */}
        {player.mlbPlayerId && (
          <section className="detail-section">
            <h2>Year-by-Year</h2>
            <PlayerYearByYear
              playerId={player.mlbPlayerId}
              playerType={player.playerType}
            />
          </section>
        )}

        <div className="home-actions">
          <button
            className={`home-link${favoriteRecord ? " secondary" : ""}`}
            type="button"
            disabled={Boolean(favoriteRecord)}
            onClick={handleAddToFavorites}
          >
            {favoriteRecord ? "✓ Already in Favorites" : "Add to Favorites"}
          </button>

          <Link
            className="home-link secondary"
            to={`/compare?p1=${player.mlbPlayerId}`}
          >
            Compare →
          </Link>

          {/* Matchup 導線:
              投手 → /matchup?pitcher=id (打者を選んで対戦成績を見る)
              打者 → /matchup?batter=id  (投手を選んで対戦成績を見る) */}
          <Link
            className="home-link secondary"
            to={
              player.playerType === "pitcher"
                ? `/matchup?pitcher=${player.mlbPlayerId}`
                : `/matchup?batter=${player.mlbPlayerId}`
            }
          >
            Matchup →
          </Link>

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

      </div>

      <section ref={similarRef} className={`similar-players reveal${similarVisible ? " visible" : ""}`}>

        {/* MLB 全体から似たスタイルの選手 */}
        <div className="section-heading">
          <h2>Players with Similar Style</h2>
          <p className="section-heading-desc">MLB players with a similar batting profile.</p>
        </div>
        {mlbSimilar.length > 0 ? (
          <div className="player-list">
            {mlbSimilar.map((p) => (
              <PlayerCard key={p.playerId} player={p} />
            ))}
          </div>
        ) : (
          <div className="home-empty-state">
            <span className="empty-state-icon"><img src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg" alt="" width={36} height={36} style={{ opacity: 0.5 }} /></span>
            <p className="empty-state-title">No Similar Players Found</p>
          </div>
        )}

        {/* 25歳以下の若手から似たスタイルの選手 */}
        {youngSimilar.length > 0 && (
          <>
            <div className="section-heading" style={{ marginTop: "2rem" }}>
              <h2>Rising Stars with Similar Style</h2>
              <p className="section-heading-desc">Players age 25 and under who share this playing style.</p>
            </div>
            <div className="player-list">
              {youngSimilar.map((p) => (
                <PlayerCard key={p.playerId} player={p} />
              ))}
            </div>
          </>
        )}

      </section>
    </div>
  );
}

export default PlayerDetailPage;
