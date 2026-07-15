import { Link } from "react-router-dom";
import styles from "./HomeHero.module.css";

// PlayerCardと同じ軸(既存のarchetypeService.jsが計算済みのstyleScores)を再利用する
const HITTER_BARS = [
  { key: "power", label: "Power" },
  { key: "speed", label: "Speed" },
  { key: "contact", label: "Contact" },
  { key: "defense", label: "Defense" },
];

const PITCHER_BARS = [
  { key: "dominance", label: "Dominance" },
  { key: "control", label: "Control" },
  { key: "durability", label: "Durability" },
];

const HEADSHOT_URL = (id) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;

// Home画面の唯一の主役。前後送り(Prev/Next)は付けない — 複数人を切り替えて
// じっくり見る体験はDiscover画面の役割のままにし、Homeは「今日イチオシの1人」
// を見せる入口に徹する。
function HomeHero({ player, loading }) {
  if (loading) {
    return (
      <section className={styles.hero}>
        <div className="skeleton-block" style={{ height: 260, borderRadius: 16 }} />
      </section>
    );
  }

  if (!player) {
    return (
      <section className={styles.hero}>
        <p className={styles.kicker}>Your Next Player</p>
        <p className={styles.emptyTitle}>Add a few favorites to get your first pick</p>
        <p className={styles.emptyDesc}>
          We&apos;ll find a player who matches your taste.
        </p>
        <Link to="/favorites" className={styles.emptyCta}>Go to Favorites →</Link>
      </section>
    );
  }

  const isPitcher = player.playerType === "pitcher";
  const bars = isPitcher ? PITCHER_BARS : HITTER_BARS;
  const scores = player.styleScores;

  return (
    <Link to={`/players/${player.mlbPlayerId}`} className={styles.hero}>
      <p className={styles.kicker}>Your Next Player</p>

      <div className={styles.matchRow}>
        <span className={styles.matchNumber}>{Math.round(player.matchScore ?? player.similarityPercentage ?? 0)}</span>
        <span className={styles.matchUnit}>% match</span>
      </div>

      <div className={styles.identity}>
        <img
          className={styles.thumb}
          src={HEADSHOT_URL(player.mlbPlayerId)}
          alt={player.name}
        />
        <div>
          <h2 className={styles.name}>{player.name}</h2>
          <p className={styles.meta}>
            {[player.position, player.team].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {player.reason && <p className={styles.reason}>{player.reason}</p>}

      {scores && (
        <div className={styles.bars}>
          {bars.map(({ key, label }) => {
            const value = scores[key];
            if (value == null) return null;
            return (
              <div className={styles.barRow} key={key}>
                <span className={styles.barLabel}>{label}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${value}%` }} />
                </div>
                <span className={styles.barValue}>{value}</span>
              </div>
            );
          })}
        </div>
      )}
    </Link>
  );
}

export default HomeHero;
