"""
/archetype/classify エンドポイント
リーグ上位200人を k-means クラスタリングで分類し、
各選手にアーキタイプラベルとスタイルスコアを付与して返す。
"""

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from sklearn.cluster import KMeans

router = APIRouter()


class ArchetypeCandidate(BaseModel):
    playerId: int
    playerType: str = "hitter"
    ops: float = 0
    homeRuns: float = 0
    stolenBases: float = 0
    avg: float = 0
    rbi: float = 0
    era: float = 0
    whip: float = 0
    strikeouts: float = 0
    walks: float = 0
    wins: float = 0
    innings: float = 0


class ArchetypeRequest(BaseModel):
    candidates: list[ArchetypeCandidate]
    playerType: str = "hitter"


class StyleScores(BaseModel):
    power: int = 0
    speed: int = 0
    contact: int = 0
    dominance: int = 0
    control: int = 0
    durability: int = 0


class ArchetypeResult(BaseModel):
    playerId: int
    archetype: str
    styleScores: StyleScores


class ArchetypeResponse(BaseModel):
    players: list[ArchetypeResult]


# ── スタイルスコア計算 ─────────────────────────────────────────────────────────
# 各スタッツを 0〜1 に正規化してスタイルの3軸を求める

def hitter_style_scores(player) -> tuple[float, float, float]:
    power   = (min(player.homeRuns / 60, 1.0) + min(player.ops / 1.2, 1.0)) / 2
    speed   = min(player.stolenBases / 80, 1.0)
    contact = (min(player.avg / 0.35, 1.0) + min(player.rbi / 130, 1.0)) / 2
    return power, speed, contact


def pitcher_style_scores(player) -> tuple[float, float, float]:
    dominance  = (min(player.strikeouts / 250, 1.0) + max(0.0, (6.0 - player.era) / 6.0)) / 2
    control    = max(0.0, min((120 - player.walks) / 120, 1.0))
    durability = min(player.innings / 220, 1.0)
    return dominance, control, durability


# ── クラスタラベル付与 ─────────────────────────────────────────────────────────
# k-means クラスタに「相対ラベル」を付与する。
# リーグ上位選手はみな平均以上のため、絶対閾値ではなく
# 「各クラスタが他クラスタより何で突出しているか」で判定する。

def label_hitter_clusters(centers: np.ndarray) -> dict[int, str]:
    """
    各クラスタ重心を比較して相対的なラベルを付与する。
    centers: shape (k, 3) — [power, speed, contact]

    戦略: グリーディー割り当て（各ラベルを1度だけ使う）
      1. Speedster   → speed が最も高いクラスタ（SB は独自性が高い）
      2. Power Hitter → power が最も高い未割り当てクラスタ
      3. Contact Hitter → contact が最も高い未割り当てクラスタ
      4. Five-Tool Threat → 残りの中で total が最も高いクラスタ
      5. All-Around  → 残り全て
    """
    n = len(centers)
    cluster_names: dict[int, str] = {}
    available = set(range(n))

    def pick_max(axis: int) -> int:
        scores = [(centers[i, axis], i) for i in available]
        return max(scores)[1]

    # 1. Speedster: speed（盗塁）は最も独自性が高い軸
    speed_idx = pick_max(1)
    cluster_names[speed_idx] = "Speedster"
    available.discard(speed_idx)

    # 2. Power Hitter: power が最も高い残りクラスタ
    if available:
        power_idx = pick_max(0)
        cluster_names[power_idx] = "Power Hitter"
        available.discard(power_idx)

    # 3. Contact Hitter: contact が最も高い残りクラスタ
    if available:
        contact_idx = pick_max(2)
        cluster_names[contact_idx] = "Contact Hitter"
        available.discard(contact_idx)

    # 4. Five-Tool Threat: total が最も高い残りクラスタ
    if available:
        best = max(available, key=lambda i: centers[i].sum())
        cluster_names[best] = "Five-Tool Threat"
        available.discard(best)

    # 5. All-Around: 残り全て
    for i in available:
        cluster_names[i] = "All-Around"

    return cluster_names


def label_pitcher_clusters(centers: np.ndarray) -> dict[int, str]:
    """
    centers: shape (k, 3) — [dominance, control, durability]
    """
    cluster_names: dict[int, str] = {}

    dom_scores  = centers[:, 0]
    ctrl_scores = centers[:, 1]
    dur_scores  = centers[:, 2]

    dom_idx  = int(dom_scores.argmax())
    ctrl_idx = int(ctrl_scores.argmax())
    dur_idx  = int(dur_scores.argmax())

    # Ace: dominance AND control が共に高い（両方のトップが同じクラスタ）
    if dom_idx == ctrl_idx:
        cluster_names[dom_idx] = "Ace"
    else:
        cluster_names[dom_idx] = "Power Pitcher"
        cluster_names[ctrl_idx] = "Control Artist"

    if dur_idx not in cluster_names:
        cluster_names[dur_idx] = "Workhorse"

    for i in range(len(centers)):
        if i not in cluster_names:
            cluster_names[i] = "Workhorse"

    return cluster_names


@router.post("/archetype/classify", response_model=ArchetypeResponse)
def classify_archetypes(req: ArchetypeRequest):
    """
    リーグ選手を k-means でアーキタイプ分類して返す。

    アルゴリズム:
      1. 各選手のスタイルスコア（Power/Speed/Contact）を計算
      2. k-means で n_clusters=5（野手）/ 4（投手）に分類
      3. 各クラスタの重心を「相対比較」してラベルを付与（絶対閾値は使わない）
    """
    if not req.candidates:
        return ArchetypeResponse(players=[])

    is_pitcher = req.playerType == "pitcher"
    n_clusters = 4 if is_pitcher else 5
    score_fn = pitcher_style_scores if is_pitcher else hitter_style_scores

    vectors = np.array([score_fn(c) for c in req.candidates], dtype=float)

    # random_state=42 で毎回同じクラスタ結果にする
    k = min(n_clusters, len(req.candidates))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(vectors)

    if is_pitcher:
        cluster_names = label_pitcher_clusters(kmeans.cluster_centers_)
    else:
        cluster_names = label_hitter_clusters(kmeans.cluster_centers_)

    results = []
    for i, (candidate, vec) in enumerate(zip(req.candidates, vectors)):
        archetype = cluster_names[int(labels[i])]
        if is_pitcher:
            scores = StyleScores(dominance=round(vec[0] * 100), control=round(vec[1] * 100), durability=round(vec[2] * 100))
        else:
            scores = StyleScores(power=round(vec[0] * 100), speed=round(vec[1] * 100), contact=round(vec[2] * 100))
        results.append(ArchetypeResult(playerId=candidate.playerId, archetype=archetype, styleScores=scores))

    return ArchetypeResponse(players=results)
