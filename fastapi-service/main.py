"""
MLB Similar Players API
FastAPI サービス — 選手の成績ベクトルをもとに類似選手を計算して返す

データの流れ:
  Express (Node.js) → FastAPI → Express → React

エンドポイント一覧:
  GET  /                       ヘルスチェック
  POST /similar                類似選手（レガシー）
  POST /recommend              推薦スコアリング
  POST /recommend/future-stars Rising Stars
  POST /discover/similar       プレイヤー発見
  POST /scouting-report        スカウティングレポート
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import archetype, discover, recommend, similar, scouting

app = FastAPI(title="MLB Similar Players API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(archetype.router)
app.include_router(similar.router)
app.include_router(recommend.router)
app.include_router(discover.router)
app.include_router(scouting.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "MLB Similar Players API"}
