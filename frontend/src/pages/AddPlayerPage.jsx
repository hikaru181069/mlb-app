import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AddPlayerPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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

      const response = await fetch("http://localhost:5001/api/players", {
        method: "POST",
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
        throw new Error("Failed to create player.");
      }
      navigate("/players");
    } catch (error) {
      console.error("Create player error:", error);
      setErrorMessage("Failed to create player.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Link className="back-link" to="/players">
        Back to players
      </Link>

      <h1>Add Player</h1>

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
          {loading ? "Adding..." : "Add Player"}
        </button>
      </form>
    </div>
  );
}

export default AddPlayerPage;
