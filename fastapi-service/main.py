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
