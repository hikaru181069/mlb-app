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

/**
 * FastAPI の /recommend を呼び出し、各選手の推薦スコアを計算してもらう。
 * 計算ロジックは FastAPI 側（Python）に集約し、Express は取得と整形に専念する。
 *
 * FastAPI が未起動・タイムアウト・エラーの場合は null を返す。
 * 呼び出し側は null を「フォールバック（ローカル計算）の合図」として扱う。
 * （Similar Players と同じく、FastAPI が落ちてもアプリは動き続ける）
 *
 * @param {Array} players - スコアリング対象の選手リスト
 *   各要素: { playerId, name, playerType, active, hitterStats, pitcherStats }
 * @returns {Map<number, {recommendationScore, recommendationReasons}> | null}
 *   playerId をキーにしたスコアの Map。失敗時は null。
 */
const fetchRecommendationScores = async (players) => {
  try {
    const response = await fetch(`${FASTAPI_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`FastAPI responded with ${response.status} — using local scoring`);
      return null;
    }

    const data = await response.json();
    // 配列 → Map に変換して、呼び出し側で playerId から引けるようにする
    return new Map(data.players.map((p) => [p.playerId, p]));
  } catch (error) {
    console.warn(`FastAPI unreachable: ${error.message} — using local scoring`);
    return null;
  }
};

/**
 * FastAPI の /recommend/future-stars を呼び出し、Future Stars候補を返す。
 * 失敗時は null を返し、呼び出し側で空配列や別フォールバックに切り替える。
 *
 * @param {Array} favoritePlayers - お気に入り選手の特徴量
 * @param {number} topN - 返す件数
 * @returns {Array|null}
 */
const fetchFutureStars = async (favoritePlayers, candidates = [], topN = 5) => {
  try {
    const response = await fetch(`${FASTAPI_URL}/recommend/future-stars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favoritePlayers, candidates, topN }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`FastAPI responded with ${response.status} — future stars unavailable`);
      return null;
    }

    const data = await response.json();
    return data.futureStars || [];
  } catch (error) {
    console.warn(`FastAPI unreachable: ${error.message} — future stars unavailable`);
    return null;
  }
};

/**
 * FastAPI の /discover/similar を呼び出す。
 * mlbCandidates と youngCandidates の2プールに対して類似度を計算して返す。
 * 失敗時は null を返し、呼び出し側で空配列にフォールバックする。
 */
const fetchDiscoverSimilar = async (target, mlbCandidates, youngCandidates, topN = 3) => {
  try {
    const response = await fetch(`${FASTAPI_URL}/discover/similar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, mlbCandidates, youngCandidates, topN }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.warn(`FastAPI discover/similar responded with ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`FastAPI discover/similar error: ${error.message}`);
    return null;
  }
};

/**
 * FastAPI の /archetype/classify を呼び出す。
 * リーグ選手リストを k-means で分類してアーキタイプを返す。
 */
const fetchArchetypeClassify = async (payload) => {
  try {
    const response = await fetch(`${FASTAPI_URL}/archetype/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.warn(`FastAPI archetype/classify responded with ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`FastAPI archetype/classify error: ${error.message}`);
    return null;
  }
};

const fetchScoutingReport = async (payload) => {
  try {
    const response = await fetch(`${FASTAPI_URL}/scouting-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`FastAPI scouting-report responded with ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`FastAPI scouting-report error: ${error.message}`);
    return null;
  }
};

/**
 * FastAPI の /compare/analyze を呼び出す。
 * 2選手のスタッツとリーグ分布を渡し、カテゴリ別優劣 + 総合アドバンテージを返す。
 */
const fetchCompareAnalyze = async (payload) => {
  try {
    const response = await fetch(`${FASTAPI_URL}/compare/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.warn(`FastAPI compare/analyze responded with ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`FastAPI compare/analyze error: ${error.message}`);
    return null;
  }
};

/**
 * FastAPI の /matchup/predict を呼び出す。
 * 投手と打者のスタッツとリーグ分布を渡し、予想成績 + アドバンテージを返す。
 */
const fetchMatchupPredict = async (payload) => {
  try {
    const response = await fetch(`${FASTAPI_URL}/matchup/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.warn(`FastAPI matchup/predict responded with ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`FastAPI matchup/predict error: ${error.message}`);
    return null;
  }
};

module.exports = {
  fetchFutureStars,
  fetchScoutingReport,
  fetchSimilarPlayerIds,
  fetchRecommendationScores,
  fetchDiscoverSimilar,
  fetchArchetypeClassify,
  fetchCompareAnalyze,
  fetchMatchupPredict,
};
