"""
/recommend             — チームレコメンデーション（ルールベーススコアリング）
/recommend/future-stars — Rising Stars（cosine similarity）
"""

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel

from core.math_utils import cosine_similarity, discovery_vector

router = APIRouter()


# ── /recommend モデル ──────────────────────────────────────────────────────────

class RecHitterStats(BaseModel):
    gamesPlayed: float = 0
    homeRuns: float = 0
    battingAverage: float = 0
    ops: float = 0


class RecPitcherStats(BaseModel):
    gamesPlayed: float = 0
    wins: float = 0
    strikeouts: float = 0
    era: float = 0


class RecPlayer(BaseModel):
    playerId: int
    name: str = ""
    playerType: str = "hitter"
    active: bool = False
    hitterStats: RecHitterStats = RecHitterStats()
    pitcherStats: RecPitcherStats = RecPitcherStats()


class RecommendRequest(BaseModel):
    players: list[RecPlayer]


class ScoredPlayer(BaseModel):
    playerId: int
    recommendationScore: int
    recommendationReasons: list[str]


class RecommendResponse(BaseModel):
    players: list[ScoredPlayer]


POPULAR = {"Shohei Ohtani", "Mookie Betts", "Freddie Freeman", "Aaron Judge"}


def has_stats(stats: BaseModel) -> bool:
    return any(v for v in stats.model_dump().values())


def score_player(p: RecPlayer) -> ScoredPlayer:
    reasons = ["Recommended from your favorite team"]
    score = 0.0

    if p.active:
        score += 20
        reasons.append("Active roster player")

    if has_stats(p.hitterStats) or has_stats(p.pitcherStats):
        score += 18
        reasons.append("Has current season stats")

    if p.playerType == "hitter":
        h = p.hitterStats
        score += min(h.gamesPlayed, 80) * 0.25
        score += h.homeRuns * 1.5
        score += h.battingAverage * 40
        score += h.ops * 30
        if h.homeRuns >= 10 or h.ops >= 0.75:
            reasons.append("Strong hitter profile")

    if p.playerType == "pitcher":
        pi = p.pitcherStats
        score += min(pi.gamesPlayed, 40) * 0.5
        score += pi.wins * 2
        score += pi.strikeouts * 0.25
        if pi.era > 0:
            score += max(0, 5 - pi.era) * 8
        if pi.strikeouts >= 40 or (0 < pi.era <= 3.5):
            reasons.append("Strong pitcher profile")

    if p.name in POPULAR:
        score += 25
        reasons.append("Popular star player")

    return ScoredPlayer(
        playerId=p.playerId,
        recommendationScore=round(score),
        recommendationReasons=reasons,
    )


@router.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    """各選手の推薦スコアと理由を計算して返す"""
    return RecommendResponse(players=[score_player(p) for p in req.players])


# ── /recommend/future-stars モデル ─────────────────────────────────────────────

class FutureStarStats(BaseModel):
    ops: float = 0
    homeRuns: float = 0
    stolenBases: float = 0
    avg: float = 0
    rbi: float = 0


class FavoriteFutureStarPlayer(BaseModel):
    playerId: int
    fullName: str = ""
    position: str = ""
    stats: FutureStarStats = FutureStarStats()


class YoungPlayerCandidate(BaseModel):
    playerId: int
    name: str = ""
    team: str = ""
    position: str = ""
    age: int = 0
    ops: float = 0
    homeRuns: float = 0
    stolenBases: float = 0
    avg: float = 0
    rbi: float = 0


class FutureStarRequest(BaseModel):
    favoritePlayers: list[FavoriteFutureStarPlayer]
    candidates: list[YoungPlayerCandidate] = []
    topN: int = 5


class FutureStar(BaseModel):
    playerId: int
    fullName: str
    organization: str
    level: str
    position: str
    age: int
    stats: FutureStarStats
    similarity: float
    similarityPercentage: int
    reasons: list[str]
    type: str = "rising"
    isExperimental: bool = False


class FutureStarResponse(BaseModel):
    futureStars: list[FutureStar]


def average_favorite_vector(players: list[FavoriteFutureStarPlayer]) -> np.ndarray:
    vectors = [discovery_vector(player.stats) for player in players]
    if not vectors:
        return np.zeros(5, dtype=float)
    return np.mean(vectors, axis=0)


def rising_star_reasons(candidate: YoungPlayerCandidate) -> list[str]:
    reasons = []
    if candidate.ops >= 0.850:
        reasons.append("Elite OPS")
    elif candidate.ops >= 0.780:
        reasons.append("Strong OPS profile")
    if candidate.homeRuns >= 25:
        reasons.append("Power hitter")
    elif candidate.homeRuns >= 15:
        reasons.append("Emerging power")
    if candidate.stolenBases >= 20:
        reasons.append("Speed threat")
    if candidate.avg >= 0.290:
        reasons.append("High contact rate")
    if candidate.rbi >= 70:
        reasons.append("Run producer")
    if candidate.age <= 23:
        reasons.append("Under 24 years old")
    elif candidate.age <= 25:
        reasons.append("Under 26 years old")
    if candidate.position in {"OF", "SS", "CF", "2B"}:
        reasons.append(f"Premium {candidate.position} profile")
    return reasons[:4] if reasons else ["Young MLB player"]


@router.post("/recommend/future-stars", response_model=FutureStarResponse)
def recommend_future_stars(req: FutureStarRequest):
    """お気に入り選手の平均プロフィールに近い若手 MLB 選手を返す"""
    if not req.favoritePlayers or not req.candidates:
        return FutureStarResponse(futureStars=[])

    target_vec = average_favorite_vector(req.favoritePlayers)
    scored = []
    for candidate in req.candidates:
        similarity = max(0.0, cosine_similarity(target_vec, discovery_vector(candidate)))
        scored.append((candidate, similarity))

    scored.sort(key=lambda item: item[1], reverse=True)
    limit = max(1, min(req.topN, len(req.candidates)))

    return FutureStarResponse(
        futureStars=[
            FutureStar(
                playerId=candidate.playerId,
                fullName=candidate.name,
                organization=candidate.team,
                level="MLB",
                position=candidate.position,
                age=candidate.age,
                stats=FutureStarStats(
                    ops=candidate.ops,
                    homeRuns=candidate.homeRuns,
                    stolenBases=candidate.stolenBases,
                    avg=candidate.avg,
                    rbi=candidate.rbi,
                ),
                similarity=round(similarity, 4),
                similarityPercentage=round(similarity * 100),
                reasons=rising_star_reasons(candidate),
            )
            for candidate, similarity in scored[:limit]
        ]
    )
