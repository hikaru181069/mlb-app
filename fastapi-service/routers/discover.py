"""
/discover/similar エンドポイント
対象選手と類似スタイルの選手を MLB 全体 / 若手プールの2つから返す。
Express 側がリーグ統計キャッシュから候補リストを作成して送信する。
"""

from fastapi import APIRouter
from pydantic import BaseModel

from core.math_utils import cosine_similarity, discovery_vector, scout_pitcher_vector

router = APIRouter()


class DiscoverTarget(BaseModel):
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


class DiscoverCandidate(BaseModel):
    playerId: int
    name: str = ""
    team: str = ""
    position: str = ""
    age: int = 0
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


class DiscoverRequest(BaseModel):
    target: DiscoverTarget
    mlbCandidates: list[DiscoverCandidate] = []
    youngCandidates: list[DiscoverCandidate] = []
    topN: int = 3


class DiscoverMatch(BaseModel):
    playerId: int
    name: str
    team: str
    position: str
    age: int
    similarity: float
    similarityPercentage: int


class DiscoverResponse(BaseModel):
    mlbSimilar: list[DiscoverMatch]
    youngSimilar: list[DiscoverMatch]


@router.post("/discover/similar", response_model=DiscoverResponse)
def discover_similar(req: DiscoverRequest):
    """
    対象選手と類似スタイルを持つ選手を2つのプールから返す。
    野手: OPS/HR/SB/AVG/RBI ベクトル / 投手: ERA/WHIP/K/BB/W/IP ベクトル
    """
    is_pitcher = req.target.playerType == "pitcher"

    def make_vector(item):
        return scout_pitcher_vector(item) if is_pitcher else discovery_vector(item)

    target_vec = make_vector(req.target)

    def rank(candidates: list[DiscoverCandidate]) -> list[DiscoverMatch]:
        scored = [
            (c, max(0.0, cosine_similarity(target_vec, make_vector(c))))
            for c in candidates
            if c.playerId != req.target.playerId
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [
            DiscoverMatch(
                playerId=c.playerId,
                name=c.name,
                team=c.team,
                position=c.position,
                age=c.age,
                similarity=round(sim, 4),
                similarityPercentage=round(sim * 100),
            )
            for c, sim in scored[: req.topN]
        ]

    return DiscoverResponse(
        mlbSimilar=rank(req.mlbCandidates),
        youngSimilar=rank(req.youngCandidates),
    )
