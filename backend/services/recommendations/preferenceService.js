const Interaction = require("../../models/Interaction");
const { fetchArchetypes } = require("../mlb/archetypeService");

// お気に入り=強いシグナル、閲覧=弱いシグナルとして重み付けする。
// dislikeはここでの加重平均には含めない(下のgetDislikedStyleProfile/
// scoreDislikePenaltyで別枠の減点として扱う。負の重みを混ぜると
// 分母(重みの合計)が0や負になり計算が壊れるため)。
const ACTION_WEIGHT = { favorite: 3, view: 1 };

// 減点の最大値(0〜100スケールのmatchScoreに対して)
const MAX_DISLIKE_PENALTY = 10;

// 直近の行動ほど重視する(14日で重みが半分になる指数減衰)。
// こうすることで「昔お気に入りにしたが今は興味が薄れた選手」より
// 「最近見ている/追加している選手」の傾向が推薦に反映されやすくなる。
const HALF_LIFE_DAYS = 14;

const HITTER_KEYS = ["power", "speed", "contact", "defense"];
const PITCHER_KEYS = ["dominance", "control", "durability"];

const decayWeight = (createdAt) => {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
};

/**
 * ユーザーの直近の行動(閲覧・お気に入り)から、プレースタイルの好みの傾向を
 * 計算する。新しい機械学習モデルは使わず、既存のstyleScores(パーセンタイル)
 * の加重平均を取るだけ。打者・投手は軸(power/speedなど)が違うため別々に集計する。
 */
const getUserPreferenceProfile = async (userId) => {
  const interactions = await Interaction.find({ user: userId, action: { $ne: "dislike" } })
    .sort({ createdAt: -1 })
    .limit(200);

  if (interactions.length === 0) return null;

  const archetypeMap = await fetchArchetypes();

  const hitterSums = Object.fromEntries(HITTER_KEYS.map((k) => [k, 0]));
  const pitcherSums = Object.fromEntries(PITCHER_KEYS.map((k) => [k, 0]));
  let hitterWeight = 0;
  let pitcherWeight = 0;

  for (const interaction of interactions) {
    const archetype = archetypeMap[Number(interaction.mlbPlayerId)];
    if (!archetype?.styleScores) continue;

    const weight = (ACTION_WEIGHT[interaction.action] || 1) * decayWeight(interaction.createdAt);

    if (interaction.playerType === "pitcher") {
      for (const k of PITCHER_KEYS) pitcherSums[k] += (archetype.styleScores[k] || 0) * weight;
      pitcherWeight += weight;
    } else {
      for (const k of HITTER_KEYS) hitterSums[k] += (archetype.styleScores[k] || 0) * weight;
      hitterWeight += weight;
    }
  }

  return {
    hitter: hitterWeight > 0
      ? Object.fromEntries(HITTER_KEYS.map((k) => [k, hitterSums[k] / hitterWeight]))
      : null,
    pitcher: pitcherWeight > 0
      ? Object.fromEntries(PITCHER_KEYS.map((k) => [k, pitcherSums[k] / pitcherWeight]))
      : null,
    sampleSize: interactions.length,
  };
};

/**
 * dislikeした選手のstyleScoresの単純平均(打者・投手別)を返す。
 * favorite/viewの好みプロファイルとは別枠で扱うため、時間減衰や重み付けは行わない
 * (「はっきり避けたい傾向」を大まかに掴めれば十分なため)。
 */
const getDislikedStyleProfile = async (userId) => {
  const interactions = await Interaction.find({ user: userId, action: "dislike" })
    .sort({ createdAt: -1 })
    .limit(200);

  if (interactions.length === 0) return null;

  const archetypeMap = await fetchArchetypes();

  const hitterSums = Object.fromEntries(HITTER_KEYS.map((k) => [k, 0]));
  const pitcherSums = Object.fromEntries(PITCHER_KEYS.map((k) => [k, 0]));
  let hitterCount = 0;
  let pitcherCount = 0;

  for (const interaction of interactions) {
    const archetype = archetypeMap[Number(interaction.mlbPlayerId)];
    if (!archetype?.styleScores) continue;

    if (interaction.playerType === "pitcher") {
      for (const k of PITCHER_KEYS) pitcherSums[k] += archetype.styleScores[k] || 0;
      pitcherCount += 1;
    } else {
      for (const k of HITTER_KEYS) hitterSums[k] += archetype.styleScores[k] || 0;
      hitterCount += 1;
    }
  }

  return {
    hitter: hitterCount > 0
      ? Object.fromEntries(HITTER_KEYS.map((k) => [k, hitterSums[k] / hitterCount]))
      : null,
    pitcher: pitcherCount > 0
      ? Object.fromEntries(PITCHER_KEYS.map((k) => [k, pitcherSums[k] / pitcherCount]))
      : null,
  };
};

/**
 * 候補選手がdislikeプロファイルにどれだけ近いかを0〜MAX_DISLIKE_PENALTYの減点として返す。
 * scoreAffinityと同じユークリッド距離の近似を使い、距離が近い(=避けたい傾向に似ている)
 * ほど減点を大きくする。
 */
const scoreDislikePenalty = (dislikedProfile, styleScores, isPitcher) => {
  if (!dislikedProfile || !styleScores) return 0;
  const keys = isPitcher ? PITCHER_KEYS : HITTER_KEYS;
  const target = isPitcher ? dislikedProfile.pitcher : dislikedProfile.hitter;
  if (!target) return 0;

  const sqDiffSum = keys.reduce((sum, k) => {
    const diff = (styleScores[k] ?? 0) - (target[k] ?? 0);
    return sum + diff * diff;
  }, 0);
  const maxDist = Math.sqrt(keys.length * 100 * 100);
  const distance = Math.sqrt(sqDiffSum);
  const closeness = Math.max(0, 1 - distance / maxDist);
  return Math.round(closeness * MAX_DISLIKE_PENALTY);
};

/**
 * 好みプロファイルと候補選手のstyleScoresがどれだけ近いかを0〜100で返す。
 * ユークリッド距離を0-100スケールに変換した単純な近似(新しい類似度エンジンは作らない)。
 */
const scoreAffinity = (profile, styleScores, isPitcher) => {
  if (!profile || !styleScores) return null;
  const keys = isPitcher ? PITCHER_KEYS : HITTER_KEYS;
  const target = isPitcher ? profile.pitcher : profile.hitter;
  if (!target) return null;

  const sqDiffSum = keys.reduce((sum, k) => {
    const diff = (styleScores[k] ?? 0) - (target[k] ?? 0);
    return sum + diff * diff;
  }, 0);
  const maxDist = Math.sqrt(keys.length * 100 * 100);
  const distance = Math.sqrt(sqDiffSum);
  return Math.round((1 - distance / maxDist) * 100);
};

module.exports = {
  getUserPreferenceProfile,
  scoreAffinity,
  getDislikedStyleProfile,
  scoreDislikePenalty,
};
