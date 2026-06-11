"""
共通の数学ユーティリティ。
cosine_similarity / calc_percentile と、各ルーターが共有するベクトル変換関数を提供する。

依存関係:
  similar.py   → cosine_similarity
  recommend.py → cosine_similarity, discovery_vector
  discover.py  → cosine_similarity, discovery_vector, scout_pitcher_vector
  scouting.py  → cosine_similarity, calc_percentile, scout_hitter_vector, scout_pitcher_vector
"""

import numpy as np


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    余弦類似度: 2つのベクトルの「向き」がどれだけ近いかを -1〜1 で返す。
    1.0 = 完全に同じ方向 / 0.0 = 無関係 / -1.0 = 逆方向
    """
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def calc_percentile(
    value: float, distribution: list[float], higher_is_better: bool = True
) -> int:
    """値がリーグ分布の何パーセンタイルに相当するかを返す。"""
    if not distribution:
        return 50
    if higher_is_better:
        below = sum(1 for v in distribution if v < value)
        return round(below / len(distribution) * 100)
    else:
        above = sum(1 for v in distribution if v > value)
        return round(above / len(distribution) * 100)


# ── 野手ベクトル ──────────────────────────────────────────────────────────────
# Rising Stars と Scouting Report の両方で同じスケールを使うため、ここで一元管理する

STAT_SCALE = np.array([1.2, 60, 80, 0.35, 130], dtype=float)


def discovery_vector(stats) -> np.ndarray:
    """
    OPS/HR/SB/AVG/RBI を STAT_SCALE で正規化した野手ベクトルを返す。
    recommend.py (Rising Stars) と discover.py (類似選手) の両方で使用する。
    """
    if isinstance(stats, dict):
        raw = stats
    else:
        raw = stats.model_dump()
    values = np.array(
        [
            raw.get("ops", 0),
            raw.get("homeRuns", 0),
            raw.get("stolenBases", 0),
            raw.get("avg", 0),
            raw.get("rbi", 0),
        ],
        dtype=float,
    )
    safe_scale = np.where(STAT_SCALE > 0, STAT_SCALE, 1.0)
    return values / safe_scale


def scout_hitter_vector(player) -> np.ndarray:
    """Scouting Report / 類似選手比較用。LeaguePlayer や ScoutingStats から野手ベクトルを作る。"""
    values = np.array(
        [player.ops, player.homeRuns, player.stolenBases, player.avg, player.rbi],
        dtype=float,
    )
    safe_scale = np.where(STAT_SCALE > 0, STAT_SCALE, 1.0)
    return values / safe_scale


# ── 投手ベクトル ──────────────────────────────────────────────────────────────


def scout_pitcher_vector(player) -> np.ndarray:
    """
    ERA/WHIP/K/BB/W/IP から投手の特徴ベクトルを作る。
    ERA・WHIP・BB は低いほど良いので最大値から引いて反転させる。
    discover.py と scouting.py の両方で使用する。
    """
    era_v  = max(0.0, (6.0  - player.era)   / 6.0)
    whip_v = max(0.0, (2.0  - player.whip)  / 2.0)
    k_v    = player.strikeouts / 250.0
    bb_v   = max(0.0, (120  - player.walks) / 120.0)
    w_v    = player.wins    / 25.0
    ip_v   = player.innings / 220.0
    return np.array([era_v, whip_v, k_v, bb_v, w_v, ip_v], dtype=float)
