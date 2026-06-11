"""
/similar エンドポイント
レガシーの類似選手 API。現在は /discover/similar に移行済みだが後方互換のため残す。
"""

from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np

from core.math_utils import cosine_similarity

router = APIRouter()


class HitterStats(BaseModel):
    battingAverage: float = 0
    homeRuns: float = 0
    rbis: float = 0


class SimplePitcherStats(BaseModel):
    era: float = 0
    strikeouts: float = 0
    inningsPitched: float = 0


class PlayerData(BaseModel):
    playerId: int
    playerType: str
    hitterStats: HitterStats = HitterStats()
    pitcherStats: SimplePitcherStats = SimplePitcherStats()


class SimilarRequest(BaseModel):
    target: PlayerData
    candidates: list[PlayerData]
    topN: int = 3


class SimilarResponse(BaseModel):
    similarPlayerIds: list[int]


def to_stats_vector(player: PlayerData) -> np.ndarray:
    if player.playerType == "pitcher":
        era_inverted = -player.pitcherStats.era if player.pitcherStats.era > 0 else 0
        return np.array(
            [era_inverted, player.pitcherStats.strikeouts, player.pitcherStats.inningsPitched],
            dtype=float,
        )
    return np.array(
        [
            player.hitterStats.battingAverage * 100,
            player.hitterStats.homeRuns,
            player.hitterStats.rbis,
        ],
        dtype=float,
    )


@router.post("/similar", response_model=SimilarResponse)
def find_similar_players(request: SimilarRequest):
    target_vec = to_stats_vector(request.target)
    scored: list[tuple[int, float]] = []
    for candidate in request.candidates:
        if candidate.playerId == request.target.playerId:
            continue
        score = cosine_similarity(target_vec, to_stats_vector(candidate))
        scored.append((candidate.playerId, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return SimilarResponse(similarPlayerIds=[pid for pid, _ in scored[: request.topN]])
