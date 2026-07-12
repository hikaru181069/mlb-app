import { Link } from "react-router-dom";

import styles from "./TodaysPick.module.css";

const HEADSHOT_URL = (id) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_400,q_auto:best/v1/people/${id}/headshot/67/current`;

function TodaysPick({ player, loading }) {
  if (loading) {
    return (
      <section className={styles.wrap}>
        <p className={styles.kicker}>Today&apos;s Pick</p>
        <div className={styles.card}>
          <div className="skeleton-block" style={{ width: 96, height: 96, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div className="skeleton-block" style={{ height: 22, width: "50%", borderRadius: 6 }} />
            <div className="skeleton-block" style={{ height: 14, width: "35%", borderRadius: 4 }} />
          </div>
        </div>
      </section>
    );
  }

  if (!player) return null;

  const playerId = player.playerId || player.mlbPlayerId;
  const name = player.fullName || player.name;
  const team = player.teamName || player.team;
  const reason = player.recommendationReasons?.[0] || player.reason;

  return (
    <section className={styles.wrap}>
      <p className={styles.kicker}>Today&apos;s Pick</p>
      <Link to={`/players/${playerId}`} className={styles.card}>
        <img
          src={player.imageUrl || player.image || HEADSHOT_URL(playerId)}
          alt={name}
          className={styles.image}
          onError={(e) => { e.currentTarget.style.opacity = "0.4"; }}
        />
        <div className={styles.body}>
          <h2 className={styles.name}>{name}</h2>
          <p className={styles.meta}>
            {[player.position, team].filter(Boolean).join(" · ")}
          </p>
          {reason && <p className={styles.reason}>{reason}</p>}
          <span className={styles.cta}>View Player →</span>
        </div>
      </Link>
    </section>
  );
}

export default TodaysPick;
