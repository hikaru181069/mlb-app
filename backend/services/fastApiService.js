// FastAPI サービスとの通信を担当するモジュール
// Express は MLB API からデータを取得し、計算だけ FastAPI に委ねる

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

/**
 * FastAPI の /similar エンドポイントを呼び出し、類似選手IDのリストを返す。
 * FastAPI が起動していない場合は空配列を返してフォールバックする。
 * （類似選手機能が使えないだけで、アプリ全体はクラッシュしない）
 *
 * @param {object} target    - 対象選手 { playerId, playerType, hitterStats?, pitcherStats? }
 * @param {Array}  candidates - 比較候補の選手リスト（同形式）
 * @param {number} topN      - 返す件数
 * @returns {number[]} 類似選手IDの配列（FastAPI 未起動時は []）
 */
const fetchSimilarPlayerIds = async (target, candidates, topN = 3) => {
  try {
    const response = await fetch(`${FASTAPI_URL}/similar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, candidates, topN }),
      // 接続タイムアウト: FastAPI が重い場合に Express を長時間ブロックしない
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`FastAPI responded with ${response.status} — similar players unavailable`);
      return [];
    }

    const data = await response.json();
    return data.similarPlayerIds;
  } catch (error) {
    // ECONNREFUSED (未起動) や AbortError (タイムアウト) をここで吸収する
    console.warn(`FastAPI unreachable: ${error.message} — similar players unavailable`);
    return [];
  }
};

module.exports = { fetchSimilarPlayerIds };
