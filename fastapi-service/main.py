"""
MLB Similar Players API
FastAPI サービス — 選手の成績ベクトルをもとに類似選手を計算して返す

データの流れ:
  Express (Node.js)
    └─ 対象選手の stats + 比較候補リストを POST /similar に送る
         └─ FastAPI が余弦類似度を計算して類似選手IDを返す
    └─ Express が MLB API で選手詳細を取得して React へ返す
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

app = FastAPI(title="MLB Similar Players API", version="1.0.0")

# Express バックエンドからのリクエストを許可
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5001"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── データモデル (Pydantic) ──────────────────────────────────────────────────
# Express から送られてくる JSON の形を定義する
# TypeScript の型定義に相当するもの


class HitterStats(BaseModel):
    battingAverage: float = 0
    homeRuns: float = 0
    rbis: float = 0


class PitcherStats(BaseModel):
    era: float = 0
    strikeouts: float = 0
    inningsPitched: float = 0


class PlayerData(BaseModel):
    playerId: int
    playerType: str  # "hitter" or "pitcher"
    hitterStats: HitterStats = HitterStats()
    pitcherStats: PitcherStats = PitcherStats()


class SimilarRequest(BaseModel):
    target: PlayerData  # 類似選手を探したい対象選手
    candidates: list[PlayerData]  # 比較候補の選手リスト
    topN: int = 3  # 返す類似選手の数


class SimilarResponse(BaseModel):
    similarPlayerIds: list[int]


# ── 類似度計算ロジック ──────────────────────────────────────────────────────


def to_stats_vector(player: PlayerData) -> np.ndarray:
    """
    選手の成績を数値ベクトルに変換する。
    余弦類似度は「ベクトルの向き」で類似度を測るので、
    同じスケールに揃えることが重要。

    hitter: [打率×100, HR, RBI]
    pitcher: [-ERA, 奪三振, 投球回]
      ※ ERAは低いほど良いので符号を反転させる
    """
    if player.playerType == "pitcher":
        era_inverted = -player.pitcherStats.era if player.pitcherStats.era > 0 else 0
        return np.array(
            [
                era_inverted,
                player.pitcherStats.strikeouts,
                player.pitcherStats.inningsPitched,
            ],
            dtype=float,
        )
    else:
        return np.array(
            [
                player.hitterStats.battingAverage * 100,  # 0.300 → 30 にスケール
                player.hitterStats.homeRuns,
                player.hitterStats.rbis,
            ],
            dtype=float,
        )


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    余弦類似度: 2つのベクトルの「向き」がどれだけ近いかを -1〜1 で表す。
    1.0 = 完全に同じ方向 (最も類似)
    0.0 = 直交 (無関係)
    """
    norm_a = np.linalg.norm(a)  # ベクトルの長さ
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


# ── エンドポイント ──────────────────────────────────────────────────────────


@app.get("/")
def health_check():
    """サービスの死活確認用"""
    return {"status": "ok", "service": "MLB Similar Players API"}


@app.post("/similar", response_model=SimilarResponse)
def find_similar_players(request: SimilarRequest):
    """
    対象選手に最も成績が近い選手IDのリストを返す。

    アルゴリズム:
      1. 対象選手の成績ベクトルを作る
      2. 各候補選手の成績ベクトルと余弦類似度を計算
      3. スコア降順でソートして上位 topN 件を返す
    """
    target_vec = to_stats_vector(request.target)

    scored: list[tuple[int, float]] = []

    for candidate in request.candidates:
        # 対象選手自身はスキップ
        if candidate.playerId == request.target.playerId:
            continue

        candidate_vec = to_stats_vector(candidate)
        score = cosine_similarity(target_vec, candidate_vec)
        scored.append((candidate.playerId, score))

    # スコア降順でソート → 上位 topN を取り出す
    scored.sort(key=lambda x: x[1], reverse=True)
    top_ids = [player_id for player_id, _ in scored[: request.topN]]

    return SimilarResponse(similarPlayerIds=top_ids)


# ── 推薦スコア（ルールベース） ────────────────────────────────────────────────
# Express の calculateRecommendationScore を移植したもの。
# 数式は現行 JS と 1:1 で同一（移行で挙動を変えないため）。
# 推薦で使う指標は /similar と異なるため、専用の Pydantic モデルを定義する。


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
    playerType: str = "hitter"  # "hitter" | "pitcher"
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
    """JS の hasStats 相当: いずれかの値が 0/None でなければ True"""
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


@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    """各選手の推薦スコアと理由を計算して返す（バランス選抜は Express 側）"""
    return RecommendResponse(players=[score_player(p) for p in req.players])


# ── Future Stars 推薦 ───────────────────────────────────────────────────────
# お気に入り選手の打撃プロフィールと、固定の有望株候補データを比較する。
# 初期版なので候補はモックデータ。LLMは使わず、特徴量の余弦類似度と
# ルールベースの理由だけで返す。


class FutureStarStats(BaseModel):
    ops: float = 0
    homeRuns: float = 0
    stolenBases: float = 0
    walks: float = 0
    strikeouts: float = 0
    age: float = 0


class FavoriteFutureStarPlayer(BaseModel):
    playerId: int
    fullName: str = ""
    position: str = ""
    stats: FutureStarStats = FutureStarStats()


class FutureStarRequest(BaseModel):
    favoritePlayers: list[FavoriteFutureStarPlayer]
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
    type: str = "prospect"
    isExperimental: bool = True


class FutureStarResponse(BaseModel):
    futureStars: list[FutureStar]


FUTURE_STAR_CANDIDATES = [
    {
        "playerId": 701350,
        "fullName": "Roman Anthony",
        "organization": "Boston Red Sox",
        "level": "MLB",
        "position": "OF",
        "age": 22,
        "stats": {
            "ops": 0.675,
            "homeRuns": 1,
            "stolenBases": 2,
            "walks": 20,
            "strikeouts": 33,
            "age": 22,
        },
    },
    {
        "playerId": 805805,
        "fullName": "Walker Jenkins",
        "organization": "Detroit Tigers",
        "level": "AAA",
        "position": "OF",
        "age": 21,
        "stats": {
            "ops": 0.785,
            "homeRuns": 2,
            "stolenBases": 5,
            "walks": 24,
            "strikeouts": 34,
            "age": 21,
        },
    },
    {
        "playerId": 806964,
        "fullName": "Sebastian Walcott",
        "organization": "Texas Rangers",
        "level": "AA",
        "position": "SS",
        "age": 20,
        "stats": {
            "ops": 0.741,
            "homeRuns": 13,
            "stolenBases": 32,
            "walks": 52,
            "strikeouts": 135,
            "age": 20,
        },
    },
    {
        "playerId": 815888,
        "fullName": "Leo De Vries",
        "organization": "Athletics",
        "level": "A+",
        "position": "SS",
        "age": 19,
        "stats": {
            "ops": 0.790,
            "homeRuns": 5,
            "stolenBases": 17,
            "walks": 35,
            "strikeouts": 58,
            "age": 19,
        },
    },
    {
        "playerId": 703601,
        "fullName": "Max Clark",
        "organization": "Detroit Tigers",
        "level": "AAA",
        "position": "OF",
        "age": 21,
        "stats": {
            "ops": 0.752,
            "homeRuns": 4,
            "stolenBases": 12,
            "walks": 38,
            "strikeouts": 56,
            "age": 21,
        },
    },
]


FUTURE_STAR_SCALE = np.array([1.2, 60, 60, 100, 180, 35], dtype=float)


def future_star_vector(stats: FutureStarStats | dict) -> np.ndarray:
    """OPS/HR/SB/BB/SO/age を同程度のスケールに正規化する。"""
    raw = stats if isinstance(stats, dict) else stats.model_dump()
    values = np.array(
        [
            raw.get("ops", 0),
            raw.get("homeRuns", 0),
            raw.get("stolenBases", 0),
            raw.get("walks", 0),
            raw.get("strikeouts", 0),
            raw.get("age", 0),
        ],
        dtype=float,
    )
    return values / FUTURE_STAR_SCALE


def average_favorite_vector(players: list[FavoriteFutureStarPlayer]) -> np.ndarray:
    vectors = [future_star_vector(player.stats) for player in players]
    if not vectors:
        return np.zeros(6, dtype=float)
    return np.mean(vectors, axis=0)


def future_star_reasons(candidate: dict) -> list[str]:
    stats = candidate["stats"]
    reasons = ["Young prospect"]

    if stats["ops"] >= 0.78:
        reasons.append("Strong OPS profile")
    if stats["homeRuns"] >= 10:
        reasons.append("Emerging power")
    if stats["walks"] >= 35:
        reasons.append("Patient approach")
    if stats["stolenBases"] >= 12:
        reasons.append("Speed upside")
    if candidate["position"] in {"OF", "SS", "CF"}:
        reasons.append(f"Premium {candidate['position']} profile")

    return reasons[:4]


@app.post("/recommend/future-stars", response_model=FutureStarResponse)
def recommend_future_stars(req: FutureStarRequest):
    """
    お気に入り選手の平均プロフィールに近いFuture Stars候補を返す。

    アルゴリズム:
      1. お気に入り選手の OPS/HR/SB/BB/SO/age を正規化
      2. 平均ベクトルを作る
      3. 固定prospect候補と余弦類似度を計算
      4. 類似度順に topN 件を返す
    """
    if not req.favoritePlayers:
        return FutureStarResponse(futureStars=[])

    target_vec = average_favorite_vector(req.favoritePlayers)
    scored = []

    for candidate in FUTURE_STAR_CANDIDATES:
        candidate_vec = future_star_vector(candidate["stats"])
        similarity = max(0.0, cosine_similarity(target_vec, candidate_vec))
        scored.append((candidate, similarity))

    scored.sort(key=lambda item: item[1], reverse=True)
    limit = max(1, min(req.topN, len(FUTURE_STAR_CANDIDATES)))

    return FutureStarResponse(
        futureStars=[
            FutureStar(
                playerId=candidate["playerId"],
                fullName=candidate["fullName"],
                organization=candidate["organization"],
                level=candidate["level"],
                position=candidate["position"],
                age=candidate["age"],
                stats=FutureStarStats(**candidate["stats"]),
                similarity=round(similarity, 4),
                similarityPercentage=round(similarity * 100),
                reasons=future_star_reasons(candidate),
            )
            for candidate, similarity in scored[:limit]
        ]
    )


# ── Scouting Report ────────────────────────────────────────────────────────
# 選手の打撃スタッツをリーグ上位200選手の分布と比較してレポートを生成する。
# Express からリーグ分布データを受け取るため、FastAPI 側はMLB APIを叩かない。
# パーセンタイル計算はリクエスト時に動的に行う（ハードコードなし）。


class ScoutingStats(BaseModel):
    ops: float = 0
    homeRuns: float = 0
    stolenBases: float = 0
    avg: float = 0
    rbi: float = 0


class LeagueStatsDistribution(BaseModel):
    ops: list[float] = []
    homeRuns: list[float] = []
    stolenBases: list[float] = []
    avg: list[float] = []
    rbi: list[float] = []


class LeaguePlayer(BaseModel):
    playerId: int
    name: str = ""
    team: str = ""
    ops: float = 0
    homeRuns: float = 0
    stolenBases: float = 0
    avg: float = 0
    rbi: float = 0


# ── 投手モデル ──────────────────────────────────────────────────────────────

class PitcherStats(BaseModel):
    era: float = 0
    whip: float = 0
    strikeouts: float = 0
    walks: float = 0
    wins: float = 0
    innings: float = 0


class PitcherStatsDistribution(BaseModel):
    era: list[float] = []
    whip: list[float] = []
    strikeouts: list[float] = []
    walks: list[float] = []
    wins: list[float] = []
    innings: list[float] = []


class PitcherLeaguePlayer(BaseModel):
    playerId: int
    name: str = ""
    team: str = ""
    era: float = 0
    whip: float = 0
    strikeouts: float = 0
    walks: float = 0
    wins: float = 0
    innings: float = 0


# ── リクエスト / レスポンス ──────────────────────────────────────────────────

class ScoutingReportRequest(BaseModel):
    playerType: str = "hitter"
    playerIdToExclude: int = 0
    # 野手フィールド
    player: ScoutingStats = ScoutingStats()
    leagueStats: LeagueStatsDistribution = LeagueStatsDistribution()
    comparablePlayers: list[LeaguePlayer] = []
    # 投手フィールド
    pitcherPlayer: PitcherStats = PitcherStats()
    pitcherLeagueStats: PitcherStatsDistribution = PitcherStatsDistribution()
    pitcherComparables: list[PitcherLeaguePlayer] = []


class ComparablePlayer(BaseModel):
    playerId: int
    name: str
    team: str
    similarity: float
    similarityPercentage: int


class ScoutingReportResponse(BaseModel):
    percentiles: dict[str, int]
    playerType: str
    strengths: list[str]
    weaknesses: list[str]
    comparablePlayers: list[ComparablePlayer]


# ── 共通ユーティリティ ────────────────────────────────────────────────────

def calc_percentile(
    value: float, distribution: list[float], higher_is_better: bool = True
) -> int:
    """値がリーグ分布の何パーセンタイルに相当するかを計算する。"""
    if not distribution:
        return 50
    if higher_is_better:
        below = sum(1 for v in distribution if v < value)
        return round(below / len(distribution) * 100)
    else:
        above = sum(1 for v in distribution if v > value)
        return round(above / len(distribution) * 100)


# ── 野手ロジック ──────────────────────────────────────────────────────────

HITTER_TYPE_THRESHOLDS = [
    ("Five-Tool Threat", lambda p: p["ops"] >= 80 and p["homeRuns"] >= 75 and p["stolenBases"] >= 75),
    ("Power Hitter",     lambda p: p["homeRuns"] >= 80 and p["ops"] >= 70),
    ("Speed Threat",     lambda p: p["stolenBases"] >= 80 and p["avg"] >= 70),
    ("RBI Machine",      lambda p: p["rbi"] >= 80 and p["homeRuns"] >= 65),
    ("Contact Hitter",   lambda p: p["avg"] >= 80),
    ("Elite Hitter",     lambda p: p["ops"] >= 85),
    ("Speedster",        lambda p: p["stolenBases"] >= 80),
]

HITTER_STRENGTH_LABELS = {
    "ops":         "Elite OPS",
    "homeRuns":    "Elite Power",
    "stolenBases": "Exceptional Speed",
    "avg":         "High Batting Average",
    "rbi":         "Run Producer",
}

HITTER_WEAKNESS_LABELS = {
    "ops":         "Below Average OPS",
    "homeRuns":    "Limited Power",
    "stolenBases": "Below Average Speed",
    "avg":         "Low Batting Average",
    "rbi":         "Low RBI Production",
}

HITTER_SCALE = np.array([1.2, 60, 80, 0.35, 130], dtype=float)


def scout_hitter_vector(player: ScoutingStats | LeaguePlayer) -> np.ndarray:
    values = np.array(
        [player.ops, player.homeRuns, player.stolenBases, player.avg, player.rbi],
        dtype=float,
    )
    safe_scale = np.where(HITTER_SCALE > 0, HITTER_SCALE, 1.0)
    return values / safe_scale


def _scouting_report_hitter(req: ScoutingReportRequest) -> ScoutingReportResponse:
    p = req.player
    dist = req.leagueStats

    percentiles = {
        "ops":         calc_percentile(p.ops,         dist.ops),
        "homeRuns":    calc_percentile(p.homeRuns,    dist.homeRuns),
        "stolenBases": calc_percentile(p.stolenBases, dist.stolenBases),
        "avg":         calc_percentile(p.avg,         dist.avg),
        "rbi":         calc_percentile(p.rbi,         dist.rbi),
    }

    player_type = "Solid Regular"
    for type_name, condition in HITTER_TYPE_THRESHOLDS:
        if condition(percentiles):
            player_type = type_name
            break

    strengths = [HITTER_STRENGTH_LABELS[s] for s, pct in percentiles.items() if pct >= 80]
    weaknesses = [HITTER_WEAKNESS_LABELS[s] for s, pct in percentiles.items() if pct <= 30]

    target_vec = scout_hitter_vector(p)
    scored = []
    for lp in req.comparablePlayers:
        if lp.playerId == req.playerIdToExclude:
            continue
        sim = max(0.0, cosine_similarity(target_vec, scout_hitter_vector(lp)))
        scored.append((lp, sim))
    scored.sort(key=lambda x: x[1], reverse=True)

    return ScoutingReportResponse(
        percentiles=percentiles,
        playerType=player_type,
        strengths=strengths,
        weaknesses=weaknesses,
        comparablePlayers=[
            ComparablePlayer(playerId=lp.playerId, name=lp.name, team=lp.team,
                             similarity=round(sim, 4), similarityPercentage=round(sim * 100))
            for lp, sim in scored[:3]
        ],
    )


# ── 投手ロジック ──────────────────────────────────────────────────────────

PITCHER_TYPE_THRESHOLDS = [
    ("Ace",             lambda p: p["era"] >= 85 and p["strikeouts"] >= 80),
    ("Power Pitcher",   lambda p: p["strikeouts"] >= 80),
    ("Control Artist",  lambda p: p["walks"] >= 85 and p["era"] >= 70),
    ("Workhorse",       lambda p: p["innings"] >= 80 and p["era"] >= 60),
    ("Veteran Starter", lambda p: p["wins"] >= 75 and p["era"] >= 55),
    ("Relief Pitcher",  lambda p: p["innings"] <= 30),
]

PITCHER_STRENGTH_LABELS = {
    "era":        "Elite ERA",
    "whip":       "Elite WHIP",
    "strikeouts": "High Strikeout Rate",
    "walks":      "Exceptional Control",
    "wins":       "Winning Record",
    "innings":    "Durable Workhorse",
}

PITCHER_WEAKNESS_LABELS = {
    "era":        "High ERA",
    "whip":       "High WHIP",
    "strikeouts": "Low Strikeout Rate",
    "walks":      "Poor Command",
    "wins":       "Win-Loss Concerns",
    "innings":    "Limited Innings",
}


def scout_pitcher_vector(player: PitcherStats | PitcherLeaguePlayer) -> np.ndarray:
    # ERA / WHIP / walks は低いほど良い → 最大値から引いて反転させる
    era_v  = max(0.0, (6.0 - player.era)   / 6.0)
    whip_v = max(0.0, (2.0 - player.whip)  / 2.0)
    k_v    = player.strikeouts / 250.0
    bb_v   = max(0.0, (120 - player.walks) / 120.0)
    w_v    = player.wins   / 25.0
    ip_v   = player.innings / 220.0
    return np.array([era_v, whip_v, k_v, bb_v, w_v, ip_v], dtype=float)


def _scouting_report_pitcher(req: ScoutingReportRequest) -> ScoutingReportResponse:
    p = req.pitcherPlayer
    dist = req.pitcherLeagueStats

    percentiles = {
        "era":        calc_percentile(p.era,        dist.era,        higher_is_better=False),
        "whip":       calc_percentile(p.whip,       dist.whip,       higher_is_better=False),
        "strikeouts": calc_percentile(p.strikeouts, dist.strikeouts, higher_is_better=True),
        "walks":      calc_percentile(p.walks,      dist.walks,      higher_is_better=False),
        "wins":       calc_percentile(p.wins,       dist.wins,       higher_is_better=True),
        "innings":    calc_percentile(p.innings,    dist.innings,    higher_is_better=True),
    }

    player_type = "Starting Pitcher"
    for type_name, condition in PITCHER_TYPE_THRESHOLDS:
        if condition(percentiles):
            player_type = type_name
            break

    strengths = [PITCHER_STRENGTH_LABELS[s] for s, pct in percentiles.items() if pct >= 80]
    weaknesses = [PITCHER_WEAKNESS_LABELS[s] for s, pct in percentiles.items() if pct <= 30]

    target_vec = scout_pitcher_vector(p)
    scored = []
    for lp in req.pitcherComparables:
        if lp.playerId == req.playerIdToExclude:
            continue
        sim = max(0.0, cosine_similarity(target_vec, scout_pitcher_vector(lp)))
        scored.append((lp, sim))
    scored.sort(key=lambda x: x[1], reverse=True)

    return ScoutingReportResponse(
        percentiles=percentiles,
        playerType=player_type,
        strengths=strengths,
        weaknesses=weaknesses,
        comparablePlayers=[
            ComparablePlayer(playerId=lp.playerId, name=lp.name, team=lp.team,
                             similarity=round(sim, 4), similarityPercentage=round(sim * 100))
            for lp, sim in scored[:3]
        ],
    )


@app.post("/scouting-report", response_model=ScoutingReportResponse)
def scouting_report(req: ScoutingReportRequest):
    """
    野手・投手を自動判別してスカウティングレポートを生成する。
    playerType == 'pitcher' のとき投手ロジック、それ以外は野手ロジックを使う。
    """
    if req.playerType == "pitcher":
        return _scouting_report_pitcher(req)
    return _scouting_report_hitter(req)
