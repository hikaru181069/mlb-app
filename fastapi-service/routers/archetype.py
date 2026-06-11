"""
/archetype/classify エンドポイント

設計: パーセンタイルベースの多ラベル分類
  - k-means（単一クラスタ）ではなく、各スタット軸を独立に評価する
  - リーグ上位200人の分布から動的に閾値を計算（固定値ではない）
  - 1選手が複数タグを持てる (例: [Speedster, Contact Hitter])
  - どの条件も満たさない場合は空リスト → フロントで styleScores を表示

パーセンタイル閾値: THRESHOLD = 75
  → 上位200人の中で上位25%（= リーグ全体で上位約5〜8%）
"""

from fastapi import APIRouter
from pydantic import BaseModel

from core.math_utils import calc_percentile

router = APIRouter()

# リーグ上位200人の中で何パーセンタイル以上でタグをつけるか
THRESHOLD = 75


# ── リクエスト / レスポンスモデル ──────────────────────────────────────────────

class ArchetypeCandidate(BaseModel):
    playerId: int
    playerType: str = "hitter"
    # 野手スタッツ
    ops: float = 0
    homeRuns: float = 0
    stolenBases: float = 0
    avg: float = 0
    rbi: float = 0
    # 投手スタッツ
    era: float = 0
    whip: float = 0
    strikeouts: float = 0
    walks: float = 0
    wins: float = 0
    innings: float = 0


class ClassifyRequest(BaseModel):
    candidates: list[ArchetypeCandidate]
    playerType: str = "hitter"


class StyleScores(BaseModel):
    # 野手軸 (0-100 パーセンタイル)
    power: int = 0
    speed: int = 0
    contact: int = 0
    # 投手軸 (0-100 パーセンタイル)
    dominance: int = 0
    control: int = 0
    durability: int = 0


class ArchetypeResult(BaseModel):
    playerId: int
    archetypes: list[str]   # 複数タグ (空リストもあり)
    styleScores: StyleScores


class ArchetypeResponse(BaseModel):
    players: list[ArchetypeResult]


# ── 分類ロジック ───────────────────────────────────────────────────────────────

def _classify_hitters(candidates: list[ArchetypeCandidate]) -> list[ArchetypeResult]:
    """
    野手を多ラベル分類する。
    各スタット軸のパーセンタイルを計算し、THRESHOLD 以上ならタグを付与する。
    """
    hr_dist  = [c.homeRuns    for c in candidates]
    sb_dist  = [c.stolenBases for c in candidates]
    avg_dist = [c.avg         for c in candidates]

    results = []
    for c in candidates:
        hr_pct  = calc_percentile(c.homeRuns,    hr_dist)
        sb_pct  = calc_percentile(c.stolenBases, sb_dist)
        avg_pct = calc_percentile(c.avg,         avg_dist)

        tags: list[str] = []
        if hr_pct >= THRESHOLD:
            tags.append("Power Hitter")
        if sb_pct >= THRESHOLD:
            tags.append("Speedster")
        if avg_pct >= THRESHOLD:
            tags.append("Contact Hitter")

        results.append(ArchetypeResult(
            playerId=c.playerId,
            archetypes=tags,
            styleScores=StyleScores(power=hr_pct, speed=sb_pct, contact=avg_pct),
        ))

    return results


def _classify_pitchers(candidates: list[ArchetypeCandidate]) -> list[ArchetypeResult]:
    """
    投手を多ラベル分類する。
    ERA・BB は低いほど良いので higher_is_better=False で計算する。
    """
    era_dist = [c.era        for c in candidates if c.era > 0]
    k_dist   = [c.strikeouts for c in candidates]
    bb_dist  = [c.walks      for c in candidates]
    ip_dist  = [c.innings    for c in candidates]

    results = []
    for c in candidates:
        era_pct = calc_percentile(c.era,        era_dist, higher_is_better=False) if c.era > 0 else 0
        k_pct   = calc_percentile(c.strikeouts, k_dist)
        bb_pct  = calc_percentile(c.walks,      bb_dist,  higher_is_better=False)
        ip_pct  = calc_percentile(c.innings,    ip_dist)

        tags: list[str] = []
        if era_pct >= THRESHOLD:
            tags.append("Ace")
        if k_pct >= THRESHOLD:
            tags.append("Power Pitcher")
        if bb_pct >= THRESHOLD:
            tags.append("Control Artist")
        if ip_pct >= THRESHOLD:
            tags.append("Workhorse")

        results.append(ArchetypeResult(
            playerId=c.playerId,
            archetypes=tags,
            styleScores=StyleScores(dominance=era_pct, control=bb_pct, durability=ip_pct),
        ))

    return results


# ── エンドポイント ─────────────────────────────────────────────────────────────

@router.post("/archetype/classify", response_model=ArchetypeResponse)
def classify_archetypes(req: ClassifyRequest):
    """
    選手リストを多ラベルアーキタイプに分類する。

    アルゴリズム:
      1. 入力された選手群（リーグ上位200人）から各スタットの分布を作成
      2. 各選手のスタットを分布に対してパーセンタイル化（0-100）
      3. THRESHOLD (75) 以上の軸にタグを付与
      4. styleScores（各軸のパーセンタイル値）も返す（フロント表示用）
    """
    if req.playerType == "pitcher":
        players = _classify_pitchers(req.candidates)
    else:
        players = _classify_hitters(req.candidates)

    return ArchetypeResponse(players=players)
