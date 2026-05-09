function TeamCard({ team, selected, handleSelectTeam }) {
  return (
    <button
      className={`team-card ${selected ? "selected" : ""}`}
      type="button"
      onClick={() => handleSelectTeam(team)}
    >
      <span>{team.abbreviation}</span>
      {team.name}
    </button>
  );
}

export default TeamCard;
