import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PlayerCard from "../components/PlayerCard";
import { getPlayersByArchetype } from "../services/api/archetypeApi";

// "power-hitter" → "Power Hitter"
const slugToTitle = (slug) =>
  slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

// アーキタイプごとの説明文
const ARCHETYPE_DESCRIPTIONS = {
  "Five-Tool Threat": "Power, speed, and contact — these players do it all.",
  "Power Hitter":     "Elite home run production and slugging ability.",
  "Speedster":        "Elite stolen base ability and speed on the bases.",
  "Contact Hitter":   "High batting average with consistent contact.",
  "All-Around":       "Balanced contributors across all offensive categories.",
  "Ace":              "Elite ERA and strikeout ability — the staff cornerstone.",
  "Power Pitcher":    "High strikeout rates with overpowering stuff.",
  "Control Artist":   "Exceptional command with minimal walks.",
  "Workhorse":        "Durable innings-eaters who take the ball every five days.",
};

function ArchetypePage() {
  const { type } = useParams();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const title = slugToTitle(type);
  const description = ARCHETYPE_DESCRIPTIONS[title] || "";

  useEffect(() => {
    setLoading(true);
    getPlayersByArchetype(type)
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="home-page px-6 py-12">
      <div className="detail-actions">
        <Link className="detail-nav-link" to="/">
          ← Home
        </Link>
      </div>

      <div className="section-heading" style={{ marginTop: "2rem" }}>
        <h1>{title}</h1>
        {description && <p className="section-heading-desc">{description}</p>}
        {!loading && (
          <p className="section-heading-desc" style={{ marginTop: "0.25rem" }}>
            {players.length} players
          </p>
        )}
      </div>

      {loading ? (
        <div className="player-list">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="player-card animate-pulse">
              <div className="rounded-lg bg-ctp-surface1" style={{ height: "200px" }} />
            </div>
          ))}
        </div>
      ) : players.length > 0 ? (
        <div className="player-list">
          {players.map((p) => (
            <PlayerCard key={p.mlbPlayerId} player={p} />
          ))}
        </div>
      ) : (
        <div className="home-empty-state">
          <img
            src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg"
            alt=""
            width={36}
            height={36}
            style={{ opacity: 0.5 }}
          />
          <p className="empty-state-title">No players found</p>
        </div>
      )}
    </div>
  );
}

export default ArchetypePage;
