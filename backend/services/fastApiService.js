// FastAPI サービスとの通信を担当するモジュール
// Express は MLB API からデータを取得し、計算だけ FastAPI に委ねる

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

/**
 * FastAPI の /similar エンドポイントを呼び出し、類似選手IDのリストを返す
 *
 * @param {object} target    - 対象選手 { playerId, playerType, hitterStats?, pitcherStats? }
 * @param {Array}  candidates - 比較候補の選手リスト（同形式）
 * @param {number} topN      - 返す件数
 * @returns {number[]} 類似選手IDの配列
 */
const fetchSimilarPlayerIds = async (target, candidates, topN = 3) => {
  const response = await fetch(`${FASTAPI_URL}/similar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, candidates, topN }),
  });

  if (!response.ok) {
    throw new Error(`FastAPI error: ${response.status}`);
  }

  const data = await response.json();
  return data.similarPlayerIds;
};

module.exports = { fetchSimilarPlayerIds };
