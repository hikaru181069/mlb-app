import { Link } from "react-router-dom";

import styles from "./TodaysPick.module.css";

const HEADSHOT_URL = (id) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_300,q_auto:best/v1/people/${id}/headshot/67/current`;

function TodaysPick({ players = [], loading }) {
  if (loading) {
    return (
      <section className={styles.wrap}>
        <p className={styles.kicker}>Today&apos;s Pick</p>
        <div className={styles.row}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.card}>
              <div className="skeleton-block" style={{ width: "100%", maxWidth: 160, aspectRatio: "1 / 1", borderRadius: "18%" }} />
              <div className="skeleton-block" style={{ height: 14, width: "70%", borderRadius: 4, marginTop: 10 }} />
              <div className="skeleton-block" style={{ height: 11, width: "50%", borderRadius: 4, marginTop: 6 }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (players.length === 0) return null;

  return (
    <section className={styles.wrap}>
      <p className={styles.kicker}>Today&apos;s Pick</p>
      <div className={styles.row}>
        {players.map((player) => {
          const playerId = player.playerId || player.mlbPlayerId;
          const name = player.fullName || player.name;
          const team = player.teamName || player.team;
          const reason = player.reason || player.archetypes?.[0];

          return (
            <Link key={playerId} to={`/players/${playerId}`} className={styles.card}>
              <img
                src={player.imageUrl || player.image || HEADSHOT_URL(playerId)}
                alt={name}
                className={styles.image}
                onError={(e) => { e.currentTarget.style.opacity = "0.4"; }}
              />
              <p className={styles.name}>{name}</p>
              <p className={styles.meta}>{team}</p>
              {reason && <p className={styles.reason}>{reason}</p>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default TodaysPick;
