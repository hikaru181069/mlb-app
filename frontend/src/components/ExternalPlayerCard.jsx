import PlayerStats from "./PlayerStats";

function ExternalPlayerCard({ player, alreadySaved, handleAddToFavorites }) {
  return (
    <article className="player-card">
      {player.image && (
        <img className="player-image" src={player.image} alt={player.name} />
      )}

      <h2>{player.name}</h2>
      {alreadySaved && (
        <p className="external-note">Already saved in your favorites</p>
      )}
      <p>Team: {player.team}</p>
      <p>Position: {player.position}</p>
      <p>Birth Date: {player.birthDate || "Unknown"}</p>
      <p>Height: {player.height || "Unknown"}</p>
      <p>Weight: {player.weight || "Unknown"}</p>
      <p>MLB Debut: {player.mlbDebutDate || "Unknown"}</p>
      <PlayerStats player={player} />
      {player.position === "Two-Way Player" && (
        <p className="external-note">
          Two-way player will start as Hitter. You can edit it before saving.
        </p>
      )}

      <button
        className="add-player-link mt-4 inline-flex items-center justify-center transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={alreadySaved}
        onClick={() => handleAddToFavorites(player)}
      >
        {alreadySaved ? "Already Favorite" : "Add to Favorites"}
      </button>
    </article>
  );
}

export default ExternalPlayerCard;
