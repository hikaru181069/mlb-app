import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PlayerForm from "../components/PlayerForm";
import { initialPlayerFormData } from "../utils/playerFormDefaults";
import {
  createPlayerRequestBody,
  updatePlayerFormData,
} from "../utils/playerFormHandlers";
import { getAuthToken } from "../utils/authStorage";
import { API_URL } from "../utils/apiConfig";

function EditPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialPlayerFormData);
  const token = getAuthToken();

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/api/players/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load player.");
        }

        setFormData({
          name: data.name,
          team: data.team,
          position: data.position,
          image: data.image,
          externalId: data.externalId || "",
          source: data.source || "Manual",
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

      const response = await fetch(`${API_URL}/api/players/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  if (!token) {
    return (
      <div className="home-page px-6 py-12">
        <div className="home-empty-state">
          <span className="empty-state-icon">🔒</span>
          <p className="empty-state-title">Login required</p>
          <p className="empty-state-desc">Please login to edit a player.</p>
          <Link className="home-link secondary" to="/login">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="home-page px-6 py-12">
        <div className="player-form mx-auto mt-8 w-full max-w-2xl animate-pulse">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-4 w-24 rounded bg-ctp-surface1" />
              <div className="h-11 w-full rounded-xl bg-ctp-surface1" />
            </div>
          ))}
          <div className="h-11 w-36 rounded-full bg-ctp-surface1" />
        </div>
      </div>
    );
  }

  return (
    <div className="home-page px-6 py-12">
      <div className="detail-actions">
        <Link className="detail-nav-link" to={`/players/${id}`}>
          ← Back to detail
        </Link>
      </div>

      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        <p className="home-kicker text-sm">Legacy Data</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          Edit Player
        </h1>
        <p className="home-description mt-4 text-base">
          Manually stored player data. Favorites are managed from the Favorites page.
        </p>
      </section>

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
