import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AddPlayerPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    team: "",
    position: "",
    image: "",
    stats: {
      battingAverage: "",
      homeRuns: "",
      rbis: "",
    },
  });

  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "battingAverage" || name === "homeRuns" || name === "rbis") {
      setFormData({
        ...formData,
        stats: {
          ...formData.stats,
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
          ...formData,
          image:
            formData.image ||
            `https://placehold.co/300x300?text=${encodeURIComponent(formData.name)}`,
          stats: {
            battingAverage: formData.stats.battingAverage,
            homeRuns: Number(formData.stats.homeRuns),
            rbis: Number(formData.stats.rbis),
          },
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
          Image URL
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
          />
        </label>

        <label>
          Batting Average
          <input
            type="text"
            name="battingAverage"
            value={formData.stats.battingAverage}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Home Runs
          <input
            type="number"
            name="homeRuns"
            value={formData.stats.homeRuns}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          RBIs
          <input
            type="number"
            name="rbis"
            value={formData.stats.rbis}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Player"}
        </button>
      </form>
    </div>
  );
}

export default AddPlayerPage;
