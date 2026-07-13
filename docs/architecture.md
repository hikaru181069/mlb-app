Architecture

Purpose

このドキュメントは、既存コードを作り直すための設計書ではない。

現在のReact・Express・FastAPI・MongoDB構成を維持しながら、MLB選手発見アプリとしてのUI/UXと推薦体験を段階的に強化するための方針を定義する。

既存コードを最大限活用し、必要な部分だけを拡張する。

⸻

Current Architecture

現在のアプリは、以下の構成で動作している。

React
↓
Express
↓
MongoDB / MLB Stats API
↓
FastAPI

それぞれの役割はすでに分離されており、この構成は今後も維持する。

⸻

Architecture Policy

Preserve Existing Code

既存機能を全面的に作り直さない。

現在実装されている以下の機能は、今後の基盤として利用する。

- ユーザー認証
- お気に入り登録
- 選手検索
- 選手詳細
- チームロスター
- MLB Stats API連携
- 類似選手推薦
- プロスペクト推薦
- MongoDBへのユーザーデータ保存
- FastAPIによる推薦計算

新しい機能は、既存機能の置き換えではなく拡張として追加する。

⸻

Frontend

Current Role

Reactは現在の画面構成と機能を維持する。

主な役割は以下のとおり。

- 画面表示
- ユーザー操作
- API通信
- 認証状態管理
- お気に入り状態管理
- 推薦結果表示

Future Extension

今後は既存画面を削除せず、Discover体験を追加する。

追加予定の要素は以下。

- スワイプ式選手カード
- Like / Dislike操作
- 推薦理由表示
- 相性スコア表示
- 操作アニメーション
- ユーザーフィードバック表示
- Collection画面の改善

既存の選手検索、選手詳細、ロスター画面は維持する。

Discover画面から既存の選手詳細画面へ遷移できるようにする。

⸻

Express Backend

Current Role

Expressは引き続きアプリケーションの中心APIとして利用する。

主な役割は以下。

- 認証
- ユーザー管理
- MongoDB操作
- MLB Stats API連携
- フロントエンド向けAPI
- FastAPIとの通信

Future Extension

新しい推薦体験に必要なAPIを段階的に追加する。

例：

POST /api/interactions
GET /api/discover
GET /api/recommendations
GET /api/preferences

ExpressはフロントエンドとFastAPIの間に立ち、ユーザー情報と推薦計算をつなぐ。

既存APIは可能な限り変更せず、後方互換性を維持する。

⸻

FastAPI Recommendation Service

Current Role

FastAPIには、すでに以下の推薦処理が存在する。

- 類似選手計算
- コサイン類似度
- 特徴量ベクトル
- プロスペクト推薦
- スカウティングレポート
- パーセンタイル計算

これらは削除せず、今後の推薦システムの基盤として利用する。

Future Extension

現在の「選手対選手」の類似度計算に、ユーザー単位の嗜好計算を追加する。

お気に入り
Like
Dislike
閲覧履歴
↓
ユーザー嗜好ベクトル
↓
候補選手との類似度計算
↓
ランキング

既存のコサイン類似度や正規化処理を再利用する。

新しい機械学習モデルを導入する場合も、既存ロジックをベースラインとして残す。

⸻

MongoDB

Current Data

既存の以下のデータは維持する。

- User
- FavoritePlayer
- ユーザー設定
- お気に入りチーム

New Data

推薦体験を強化するため、ユーザー操作履歴を追加する。

{
userId,
playerId,
action: "like" | "dislike" | "favorite" | "skip" | "view",
source: "discover" | "search" | "recommendation",
algorithmVersion: "v1",
createdAt
}

既存のお気に入りデータは、強い正例として推薦に利用する。

⸻

Recommendation Flow

現在の推薦フローを完全に置き換えるのではなく、段階的に拡張する。

Current Flow

お気に入り選手
↓
特徴量取得
↓
類似度計算
↓
類似選手・プロスペクト推薦

Extended Flow

お気に入り
Like
Dislike
閲覧履歴
↓
既存の特徴量生成処理
↓
ユーザー嗜好ベクトル
↓
既存の類似度計算
↓
候補選手ランキング
↓
Discover画面に表示

既存の推薦ロジックをユーザー単位に拡張する。

⸻

Migration Strategy

Phase 1: UI追加

既存機能を維持したまま、Discover画面を追加する。

- 選手カード
- Like
- Dislike
- Favorite
- 詳細画面への遷移

この段階では既存の推薦APIを利用する。

⸻

Phase 2: 操作履歴保存

Like・Dislike・閲覧履歴をMongoDBに保存する。

既存のお気に入り登録機能はそのまま使用する。

⸻

Phase 3: ユーザー嗜好ベクトル

FastAPIにユーザー嗜好ベクトル生成処理を追加する。

既存の選手特徴量とコサイン類似度を再利用する。

⸻

Phase 4: 推薦理由

類似度への寄与が大きい特徴量を利用して、推薦理由を生成する。

例：

長打力と走力が、お気に入り選手の傾向に近い選手です。

⸻

Phase 5: 評価と改善

推薦結果に対する以下の行動を計測する。

- Like率
- Dislike率
- 詳細画面遷移率
- お気に入り追加率

既存アルゴリズムと改善後アルゴリズムを比較する。

⸻

Non-Goals

現時点では以下を行わない。

- Reactから別フレームワークへの全面移行
- Expressの廃止
- FastAPIの廃止
- MongoDBの変更
- 全APIの再設計
- 既存画面の全面削除
- 複雑な深層学習モデルの導入

アーキテクチャ変更よりも、既存コードを活かした体験改善を優先する。

⸻

Engineering Principles

- 既存コードを優先して再利用する
- 全面リプレイスを避ける
- 小さな変更を積み重ねる
- 既存APIとの互換性を保つ
- UI/UX改善を最優先する
- 推薦アルゴリズムは段階的に改善する
- 新機能は既存機能の拡張として実装する
- 動いている機能を不必要に壊さない

⸻

Final Direction

このアプリの進化は、作り直しではない。

現在のMLBアプリに、

- 発見体験
- ユーザー操作データ
- パーソナライズ
- 滑らかなUI/UX

を追加していく。

現在のコードは完成品ではなく、次の段階へ進むための土台である。
