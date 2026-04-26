import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function PlayerDetailPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5001/api/players/${id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load player.");
        }

        setPlayer(data);
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
  }, [id]);

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
        <Link className="back-link" to="/">
          Back to players
        </Link>
      </div>
    );
  }

  if (!player) {
    return null;
  }

  return (
    <div className="app">
      <Link className="back-link" to="/">
        Back to players
      </Link>

      <div className="player-detail">
        {player.image && (
          <img className="detail-image" src={player.image} alt={player.name} />
        )}

        <div>
          <h1>{player.name}</h1>
          <p>Team: {player.team}</p>
          <p>Position: {player.position}</p>

          {player.stats && (
            <div className="stats">
              <p>AVG: {player.stats.battingAverage}</p>
              <p>HR: {player.stats.homeRuns}</p>
              <p>RBI: {player.stats.rbis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerDetailPage;
