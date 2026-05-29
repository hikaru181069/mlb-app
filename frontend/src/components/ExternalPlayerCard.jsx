import { Link } from "react-router-dom";

function ExternalPlayerCard({ player, alreadySaved, detailState }) {
  const detailPath = `/players/${player.mlbPlayerId}`;
  const h = player.hitterStats;
  const p = player.pitcherStats;

  return (
    <article className="player-card">
      <Link className="player-card-link" to={detailPath} state={detailState}>
        {player.image && (
          <div className="player-image-wrapper">
            <img className="player-image" src={player.image} alt={player.name} />
          </div>
        )}

        <h2>{player.name}</h2>

        <div className="player-card-team">
          {player.teamId && (
            <img
              src={`https://www.mlbstatic.com/team-logos/${player.teamId}.svg`}
              alt={player.team}
              className="player-card-team-logo"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
          <span>{player.team}</span>
        </div>
        <p>Position: {player.position}</p>

        {player.recommendationReasons?.length > 0 && (
          <p className="external-note">
            {player.recommendationReasons.slice(0, 2).join(" / ")}
          </p>
        )}

        {player.playerType === "hitter" && h && (
          <div className="stats">
            <p>AVG: {h.battingAverage} | HR: {h.homeRuns} | RBI: {h.rbis}</p>
          </div>
        )}
        {player.playerType === "pitcher" && p && (
          <div className="stats">
            <p>ERA: {p.era} | SO: {p.strikeouts} | IP: {p.inningsPitched}</p>
          </div>
        )}
      </Link>

      <div className="mt-4 text-center">
        <Link
          className={`home-link${alreadySaved ? "" : " secondary"}`}
          to={detailPath}
          state={detailState}
        >
          {alreadySaved ? "Already Saved" : "View Detail →"}
        </Link>
      </div>
    </article>
  );
}

export default ExternalPlayerCard;
