function PlayerForm({
  formData,
  handleChange,
  handleSubmit,
  loading,
  buttonText,
}) {
  return (
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
        {loading ? "Saving..." : buttonText}
      </button>
    </form>
  );
}

export default PlayerForm;
