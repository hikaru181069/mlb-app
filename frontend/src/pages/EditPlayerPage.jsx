import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function EditPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    team: "",
    position: "",
    image: "",
    playerType: "hitter",
    hitterStats: {
      battingAverage: "",
      homeRuns: "",
      rbis: "",
    },
    pitcherStats: {
      era: "",
      strikeouts: "",
      inningsPitched: "",
    },
  });

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

    if (name === "battingAverage" || name === "homeRuns" || name === "rbis") {
      setFormData({
        ...formData,
        hitterStats: {
          ...formData.hitterStats,
          [name]: value,
        },
      });
      return;
    }

    if (name === "era" || name === "strikeouts" || name === "inningsPitched") {
      setFormData({
        ...formData,
        pitcherStats: {
          ...formData.pitcherStats,
          [name]: value,
        },
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
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
        body: JSON.stringify({
          name: formData.name,
          team: formData.team,
          position: formData.position,
          image:
            formData.image ||
            `https://placehold.co/300x300?text=${encodeURIComponent(formData.name)}`,
          playerType: formData.playerType,
          hitterStats:
            formData.playerType === "hitter"
              ? {
                  battingAverage: formData.hitterStats.battingAverage,
                  homeRuns: Number(formData.hitterStats.homeRuns),
                  rbis: Number(formData.hitterStats.rbis),
                }
              : undefined,
          pitcherStats:
            formData.playerType === "pitcher"
              ? {
                  era: formData.pitcherStats.era,
                  strikeouts: Number(formData.pitcherStats.strikeouts),
                  inningsPitched: formData.pitcherStats.inningsPitched,
                }
              : undefined,
        }),
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

      <form className="player-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Team
          <input
            type="text"
            name="team"
            value={formData.team}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Position
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Player Type
          <select
            name="playerType"
            value={formData.playerType}
            onChange={handleChange}
          >
            <option value="hitter">Hitter</option>
            <option value="pitcher">Pitcher</option>
          </select>
        </label>

        <label>
          Image URL
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
          />
        </label>

        {formData.playerType === "hitter" && (
          <>
            <label>
              Batting Average
              <input
                type="text"
                name="battingAverage"
                value={formData.hitterStats.battingAverage}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Home Runs
              <input
                type="number"
                name="homeRuns"
                value={formData.hitterStats.homeRuns}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              RBIs
              <input
                type="number"
                name="rbis"
                value={formData.hitterStats.rbis}
                onChange={handleChange}
                required
              />
            </label>
          </>
        )}

        {formData.playerType === "pitcher" && (
          <>
            <label>
              ERA
              <input
                type="text"
                name="era"
                value={formData.pitcherStats.era}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Strikeouts
              <input
                type="number"
                name="strikeouts"
                value={formData.pitcherStats.strikeouts}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Innings Pitched
              <input
                type="text"
                name="inningsPitched"
                value={formData.pitcherStats.inningsPitched}
                onChange={handleChange}
                required
              />
            </label>
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Player"}
        </button>
      </form>
    </div>
  );
}

export default EditPlayerPage;
