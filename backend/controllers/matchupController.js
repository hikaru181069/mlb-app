// 対戦成績コントローラー
// MLB Stats API の vsPlayer エンドポイントを使い、
// 投手 vs 打者のキャリア通算対戦成績を返す。
//
// データの流れ:
//   GET /api/matchup?pitcherId=660271&batterId=592450
//     → MLB Stats API: /people/{pitcherId}/stats?stats=vsPlayer&group=pitching&opposingPlayerId={batterId}
//     → 集計データを整形して返す

const { fetchFromMlbApi } = require("../services/mlb/mlbClient");

const getMatchupStats = async (req, res) => {
  const { pitcherId, batterId } = req.query;

  if (!pitcherId || !batterId) {
    return res.status(400).json({ message: "pitcherId and batterId are required." });
  }

  try {
    // MLB Stats API: vsPlayer (投手視点で打者との通算成績を取得)
    const url =
      `https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats` +
      `?stats=vsPlayer&group=pitching&opposingPlayerId=${batterId}`;

    const data = await fetchFromMlbApi(url, "Failed to fetch matchup stats");

    // vsPlayerTotal が通算集計（vsPlayer は年度別）
    const totalEntry = (data.stats || []).find(
      (s) => s.type?.displayName === "vsPlayerTotal"
    );
    const splits = totalEntry?.splits ?? [];

    if (splits.length === 0) {
      // 対戦なし
      return res.json({ hasData: false, stats: null });
    }

    const raw = splits[0].stat;

    // フロントで使いやすい形に整形
    const stats = {
      gamesPlayed:    raw.gamesPlayed      ?? 0,
      atBats:         raw.atBats           ?? 0,
      hits:           raw.hits             ?? 0,
      homeRuns:       raw.homeRuns         ?? 0,
      rbi:            raw.rbi              ?? 0,
      strikeOuts:     raw.strikeOuts       ?? 0,
      baseOnBalls:    raw.baseOnBalls      ?? 0,
      avg:            raw.avg              ?? ".---",
      obp:            raw.obp              ?? ".---",
      slg:            raw.slg              ?? ".---",
      ops:            raw.ops              ?? ".---",
      numberOfPitches: raw.numberOfPitches ?? 0,
    };

    return res.json({ hasData: true, stats });
  } catch (error) {
    console.error("Matchup stats error:", error.message);
    return res.status(500).json({ message: "Failed to fetch matchup stats." });
  }
};

module.exports = { getMatchupStats };
