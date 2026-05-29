import { Link } from "react-router-dom";
import { mlbTeams } from "../services/mlbTeams";

function PlayerCard({ player }) {
  const playerId =
    player.playerId || player.mlbPlayerId || player.externalId || player._id;
  const name = player.fullName || player.name;
  const team = player.teamName || player.team;
  const position = player.position;
  const image = player.imageUrl || player.image;
  const h = player.hitterStats;
  const p = player.pitcherStats;

  const teamId = player.teamId
    ?? mlbTeams.find((t) => t.name.toLowerCase() === (team || "").toLowerCase())?.id;

  return (
    <Link
      className="player-card transition duration-200 hover:-translate-y-1 hover:shadow-2xl"
      to={`/players/${playerId}`}
    >
      {image && (
        <div className="player-image-wrapper">
          <img className="player-image" src={image} alt={name} />
        </div>
      )}
      <h2>{name}</h2>
      <div className="player-card-team">
        {teamId && (
          <img
            src={`https://www.mlbstatic.com/team-logos/${teamId}.svg`}
            alt={team}
            className="player-card-team-logo"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}
        <span>{team}</span>
      </div>
      <p>Position: {position}</p>
      {player.shortBio && <p>{player.shortBio}</p>}
      {player.reason && <p className="external-note">{player.reason}</p>}
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
  );
}

export default PlayerCard;
