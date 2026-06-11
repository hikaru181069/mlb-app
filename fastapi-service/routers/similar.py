"""
/similar エンドポイント
レガシーの類似選手 API。現在は /discover/similar に移行済みだが後方互換のため残す。
"""

from fastapi import APIRouter
from pydantic import BaseModel

from core.math_utils import cosine_similarity, discovery_vector, scout_pitcher_vector

router = APIRouter()


class SimilarPlayer(BaseModel):
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


class SimilarRequest(BaseModel):
    target: SimilarPlayer
    candidates: list[SimilarPlayer]
    topN: int = 3


class SimilarResult(BaseModel):
    playerId: int
    similarity: float
    similarityPercentage: int


class SimilarResponse(BaseModel):
    similarPlayerIds: list[int]   # 後方互換
    results: list[SimilarResult]  # スコア付き


def make_vector(player: SimilarPlayer):
    if player.playerType == "pitcher":
        return scout_pitcher_vector(player)
    return discovery_vector(player)


@router.post("/similar", response_model=SimilarResponse)
def find_similar_players(request: SimilarRequest):
    target_vec = make_vector(request.target)
    scored = [
        (c, max(0.0, cosine_similarity(target_vec, make_vector(c))))
        for c in request.candidates
        if c.playerId != request.target.playerId
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[: request.topN]
    return SimilarResponse(
        similarPlayerIds=[c.playerId for c, _ in top],
        results=[
            SimilarResult(
                playerId=c.playerId,
                similarity=round(sim, 4),
                similarityPercentage=round(sim * 100),
            )
            for c, sim in top
        ],
    )
