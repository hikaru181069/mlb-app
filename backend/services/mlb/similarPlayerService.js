// 類似選手を取得するサービス
//
// 処理の流れ:
//   1. 対象選手の stats を MLB API から取得
//   2. 同じチームのロスター選手の stats を取得（比較候補）
//   3. FastAPI /similar に送って類似選手 ID を受け取る
//   4. 類似選手 ID から詳細情報を MLB API で取得して返す

const { fetchExternalPlayerDetails, fetchExternalPlayerStats } = require("./playerStatsService");
const { formatExternalPlayer, formatExternalStats } = require("./playerFormatter");
const { fetchFromMlbApi } = require("./mlbClient");
const { buildTeamRosterUrl } = require("./mlbUrlBuilder");
const { fetchSimilarPlayerIds } = require("../fastApiService");

/**
 * 選手データを FastAPI に渡せる形式に変換する
 */
const toFastApiPayload = (player) => ({
  playerId: player.mlbPlayerId,
  playerType: player.playerType || "hitter",
  hitterStats: {
    battingAverage: player.hitterStats?.battingAverage || 0,
    homeRuns: player.hitterStats?.homeRuns || 0,
    rbis: player.hitterStats?.rbis || 0,
  },
  pitcherStats: {
    era: player.pitcherStats?.era || 0,
    strikeouts: player.pitcherStats?.strikeouts || 0,
    inningsPitched: player.pitcherStats?.inningsPitched || 0,
  },
});

/**
 * teamId からロスター選手の stats をまとめて取得する
 */
const fetchRosterWithStats = async (teamId, excludePlayerId) => {
  const data = await fetchFromMlbApi(
    buildTeamRosterUrl(teamId),
    "Failed to fetch team roster"
  );
  const roster = (data.roster || []).slice(0, 15); // API 負荷を抑えるため上位15人

  const players = await Promise.all(
    roster.map(async (entry) => {
      const id = entry.person?.id;
      if (!id || Number(id) === Number(excludePlayerId)) return null;

      try {
        const detail = await fetchExternalPlayerDetails(id);
        const base = formatExternalPlayer(detail);
        const stats = await fetchExternalPlayerStats({ playerId: id });
        const formatted = formatExternalStats(stats);
        return { ...base, ...formatted };
      } catch {
        return null;
      }
    })
  );

  return players.filter(Boolean);
};

/**
 * playerId に類似した選手リストを返すメイン関数
 */
const fetchSimilarPlayers = async (playerId) => {
  // 1. 対象選手の情報を取得
  const detail = await fetchExternalPlayerDetails(playerId);
  const target = formatExternalPlayer(detail);
  const stats = await fetchExternalPlayerStats({ playerId });
  const formattedStats = formatExternalStats(stats);
  const targetPlayer = { ...target, ...formattedStats };

  // teamId がなければ類似選手を探せないので空を返す
  if (!targetPlayer.teamId) return [];

  // 2. 同チームのロスター選手を取得（比較候補）
  const candidates = await fetchRosterWithStats(targetPlayer.teamId, playerId);

  if (candidates.length === 0) return [];

  // 3. FastAPI で類似選手 ID を計算
  const similarIds = await fetchSimilarPlayerIds(
    toFastApiPayload(targetPlayer),
    candidates.map(toFastApiPayload),
    3
  );

  // 4. 類似選手 ID から詳細情報を取得
  const similarPlayers = await Promise.all(
    similarIds.map(async (id) => {
      try {
        const d = await fetchExternalPlayerDetails(id);
        const s = await fetchExternalPlayerStats({ playerId: id });
        return { ...formatExternalPlayer(d), ...formatExternalStats(s) };
      } catch {
        return null;
      }
    })
  );

  return similarPlayers.filter(Boolean);
};

module.exports = { fetchSimilarPlayers };
