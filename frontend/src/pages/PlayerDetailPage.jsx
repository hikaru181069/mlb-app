import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PlayerStats from "../components/PlayerStats";

function PlayerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this player?",
    );
    if (!confirmed) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5001/api/players/${id}`, {
        method: "DELETE",
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
      <Link className="back-link" to="/players">
        Back to players
      </Link>
      <Link className="edit-link" to={`/players/${id}/edit`}>
        Edit Player
      </Link>

      <button className="delete-button" type="button" onClick={handleDelete}>
        Delete Player
      </button>

      <div className="player-detail">
        {player.image && (
          <img className="detail-image" src={player.image} alt={player.name} />
        )}

        <div>
          <h1>{player.name}</h1>
          <p>Team: {player.team}</p>
          <p>Position: {player.position}</p>

          <PlayerStats player={player} />
        </div>
      </div>
    </div>
  );
}

export default PlayerDetailPage;
