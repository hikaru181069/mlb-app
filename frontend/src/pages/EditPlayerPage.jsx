import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PlayerForm from "../components/PlayerForm";
import { initialPlayerFormData } from "../utils/playerFormDefaults";
import {
  createPlayerRequestBody,
  updatePlayerFormData,
} from "../utils/playerFormHandlers";

function EditPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialPlayerFormData);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);

        const response = await fetch(`http://localhost:5001/api/players/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load player.");
        }

        setFormData({
          name: data.name,
          team: data.team,
          position: data.position,
          image: data.image,
          playerType: data.playerType || "hitter",
          hitterStats: {
            battingAverage: data.hitterStats?.battingAverage || "",
            homeRuns: data.hitterStats?.homeRuns || "",
            rbis: data.hitterStats?.rbis || "",
          },
          pitcherStats: {
            era: data.pitcherStats?.era || "",
            strikeouts: data.pitcherStats?.strikeouts || "",
            inningsPitched: data.pitcherStats?.inningsPitched || "",
          },
        });

        setErrorMessage("");
      } catch (error) {
        console.error("Fetch player error:", error);
        setErrorMessage("Failed to load player.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(updatePlayerFormData(formData, name, value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(`http://localhost:5001/api/players/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createPlayerRequestBody(formData)),
      });

      if (!response.ok) {
        throw new Error("Failed to update player.");
      }

      navigate(`/players/${id}`);
    } catch (error) {
      console.error("Update player error:", error);
      setErrorMessage("Failed to update player.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <p className="status-message">Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Link className="back-link" to={`/players/${id}`}>
        Back to detail
      </Link>

      <h1>Edit Player</h1>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <PlayerForm
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        loading={loading}
        buttonText="Update Player"
      />
    </div>
  );
}

export default EditPlayerPage;
