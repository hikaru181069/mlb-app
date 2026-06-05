import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PlayerSearchSelect from "../components/PlayerSearchSelect";
import PageHeader from "../components/PageHeader";
import { getExternalPlayerDetail } from "../services/api/externalPlayerApi";

// --- stat definitions ---
const HITTER_STATS = [
  { key: "gamesPlayed",    label: "G",   higherIsBetter: true },
  { key: "battingAverage", label: "AVG", higherIsBetter: true },
  { key: "homeRuns",       label: "HR",  higherIsBetter: true },
  { key: "rbis",           label: "RBI", higherIsBetter: true },
  { key: "ops",            label: "OPS", higherIsBetter: true },
];

const PITCHER_STATS = [
  { key: "gamesPlayed",    label: "G",   higherIsBetter: true },
  { key: "wins",           label: "W",   higherIsBetter: true },
  { key: "era",            label: "ERA", higherIsBetter: false },
  { key: "strikeouts",     label: "K",   higherIsBetter: true },
  { key: "inningsPitched", label: "IP",  higherIsBetter: true },
];

// --- helpers ---
const toNum = (v) => {
  if (v == null || v === "" || v === "-") return null;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? null : n;
};

const calcWinner = (a, b, higherIsBetter) => {
  const na = toNum(a);
  const nb = toNum(b);
  if (na == null || nb == null) return null;
  if (na === nb) return "tie";
  return higherIsBetter ? (na > nb ? "left" : "right") : (na < nb ? "left" : "right");
};

// 左右のバー幅 (%) を計算
const barPcts = (lv, rv, higherIsBetter) => {
  const ln = toNum(lv);
  const rn = toNum(rv);
  if (ln == null && rn == null) return [0, 0];
  if (ln == null) return [0, 100];
  if (rn == null) return [100, 0];
  if (ln === rn) return [100, 100];
  if (higherIsBetter) {
    const m = Math.max(ln, rn);
    return [ln / m * 100, rn / m * 100];
  } else {
    // 低い方が優秀 (ERA等): 低いほど長いバー
    const minV = Math.min(ln, rn);
    return [minV / ln * 100, minV / rn * 100];
  }
};

// --- StatBarRow ---
function StatBarRow({ stat, leftStats, rightStats, ready }) {
  const lv = leftStats?.[stat.key];
  const rv = rightStats?.[stat.key];
  const w = calcWinner(lv, rv, stat.higherIsBetter);
  const [lPct, rPct] = barPcts(lv, rv, stat.higherIsBetter);

  return (
    <div className="cbar-row">
      {/* 左値 */}
      <span className={`cbar-val cbar-val--left ${w === "left" ? "cbar-val--win" : ""}`}>
        {lv ?? "—"}
      </span>

      {/* 左バー（中央 → 左へ伸びる） */}
      <div className="cbar-track cbar-track--left">
        <div
          className={`cbar-fill cbar-fill--left ${w === "left" ? "cbar-fill--win-left" : ""}`}
          style={{ width: ready ? `${lPct}%` : "0%" }}
        />
      </div>

      {/* ラベル */}
      <span className="cbar-label">{stat.label}</span>

      {/* 右バー（中央 → 右へ伸びる） */}
      <div className="cbar-track cbar-track--right">
        <div
          className={`cbar-fill cbar-fill--right ${w === "right" ? "cbar-fill--win-right" : ""}`}
          style={{ width: ready ? `${rPct}%` : "0%" }}
        />
      </div>

      {/* 右値 */}
      <span className={`cbar-val cbar-val--right ${w === "right" ? "cbar-val--win" : ""}`}>
        {rv ?? "—"}
      </span>
    </div>
  );
}

// --- StatBarsSection ---
function StatBarsSection({ title, stats, leftStats, rightStats }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (!leftStats && !rightStats) return null;

  return (
    <div className="cbar-section">
      <p className="cbar-section-title">{title}</p>
      {stats.map((stat) => (
        <StatBarRow
          key={stat.key}
          stat={stat}
          leftStats={leftStats}
          rightStats={rightStats}
          ready={ready}
        />
      ))}
    </div>
  );
}

// --- PlayerBattleCard ---
function PlayerBattleCard({ player, side }) {
  return (
    <div className={`cbattle-card cbattle-card--${side}`}>
      {player.image && (
        <img
          src={player.image}
          alt={player.name || player.fullName}
          className="cbattle-img"
        />
      )}
      <Link to={`/players/${player.mlbPlayerId}`} className="cbattle-name">
        {player.name || player.fullName}
      </Link>
      <div className="cbattle-meta">
        {player.teamId && (
          <img
            src={`https://www.mlbstatic.com/team-logos/${player.teamId}.svg`}
            alt={player.team}
            style={{ width: 16, height: 16 }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}
        <span>{player.team}</span>
        <span className="cbattle-pos">{player.position}</span>
      </div>
    </div>
  );
}

// --- BattleResult (VS animation + bars) ---
function BattleResult({ player1, player2, leftHitter, leftPitcher, rightHitter, rightPitcher }) {
  const showHitter  = leftHitter  || rightHitter;
  const showPitcher = leftPitcher || rightPitcher;

  return (
    <div className="cbattle-wrap">
      {/* VS ヘッダー */}
      <div className="cbattle-header">
        <div className="cbattle-side cbattle-side--left">
          <PlayerBattleCard player={player1} side="left" />
        </div>

        <div className="cbattle-vs-col">
          <span className="cbattle-vs">VS</span>
        </div>

        <div className="cbattle-side cbattle-side--right">
          <PlayerBattleCard player={player2} side="right" />
        </div>
      </div>

      {/* バーグラフ */}
      <div className="cbattle-stats">
        {/* プレイヤー名ヘッダー */}
        <div className="cbar-names">
          <span className="cbar-name cbar-name--left">
            {player1.name || player1.fullName}
          </span>
          <span className="cbar-name-center" />
          <span className="cbar-name cbar-name--right">
            {player2.name || player2.fullName}
          </span>
        </div>

        {showHitter && (
          <StatBarsSection
            title="Hitting"
            stats={HITTER_STATS}
            leftStats={leftHitter}
            rightStats={rightHitter}
          />
        )}
        {showPitcher && (
          <StatBarsSection
            title="Pitching"
            stats={PITCHER_STATS}
            leftStats={leftPitcher}
            rightStats={rightPitcher}
          />
        )}
      </div>
    </div>
  );
}

// --- Main page ---
function ComparePage() {
  const [searchParams] = useSearchParams();
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [loadingInit, setLoadingInit] = useState(false);

  // URL params から自動ロード (Favorites 経由)
  useEffect(() => {
    const p1 = searchParams.get("p1");
    const p2 = searchParams.get("p2");
    if (!p1 || !p2) return;

    const load = async () => {
      setLoadingInit(true);
      try {
        const [d1, d2] = await Promise.all([
          getExternalPlayerDetail(p1),
          getExternalPlayerDetail(p2),
        ]);
        setPlayer1(d1);
        setPlayer2(d2);
      } catch {
        // silent fallback
      } finally {
        setLoadingInit(false);
      }
    };
    load();
  }, [searchParams]);

  const season     = new Date().getFullYear();
  const bothLoaded = player1 && player2;

  // players が変わるたびに VS アニメーションをリセットするキー
  const animKey = `${player1?.mlbPlayerId ?? "x"}-${player2?.mlbPlayerId ?? "x"}`;

  const leftHitter  = player1?.currentSeasonStats?.hitterStats  || player1?.hitterStats;
  const leftPitcher = player1?.currentSeasonStats?.pitcherStats || player1?.pitcherStats;
  const rightHitter = player2?.currentSeasonStats?.hitterStats  || player2?.hitterStats;
  const rightPitcher= player2?.currentSeasonStats?.pitcherStats || player2?.pitcherStats;

  return (
    <div className="app-screen">
      <PageHeader
        kicker={`${season} Season`}
        title="Player Compare"
        subtitle="Search two players or select from your Favorites to compare stats."
        backTo="/favorites"
        backLabel="Pick from Favorites"
      />

      <div className="screen-body px-6 py-6 w-full">
        {loadingInit ? (
          <p className="compare-loading">Loading players…</p>
        ) : (
          <>
            {/* 検索スロット */}
            <div className="compare-search-row">
              <PlayerSearchSelect label="Player 1" player={player1} onSelect={setPlayer1} />
              <div className="compare-vs">VS</div>
              <PlayerSearchSelect label="Player 2" player={player2} onSelect={setPlayer2} />
            </div>

            {/* VS アニメーション + バーグラフ */}
            {bothLoaded && (
              <BattleResult
                key={animKey}
                player1={player1}
                player2={player2}
                leftHitter={leftHitter}
                leftPitcher={leftPitcher}
                rightHitter={rightHitter}
                rightPitcher={rightPitcher}
              />
            )}

            {!bothLoaded && (
              <div className="home-empty-state">
                <span className="empty-state-icon">⚾</span>
                <p className="empty-state-title">Select two players to compare</p>
                <p className="empty-state-desc">
                  Search by name above, or pick players from your Favorites.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ComparePage;
