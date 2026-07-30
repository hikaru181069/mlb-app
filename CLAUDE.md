# CLAUDE.md

## Project

このプロジェクトは学習用・ポートフォリオ用のMLBアプリです。
プロダクトの目的や方向性は以下を参照してください。

- @docs/vision.md（プロダクトのWHY・成功の定義）
- @docs/design.md（デザインコンセプト・UI方針）
- @docs/product-principles.md（機能設計の判断基準）
- @docs/architecture.md（技術構成・実装方針）

方向性が変わった場合は、CLAUDE.mdではなく、変更内容に応じて該当するdocs（vision.md / design.md / product-principles.md / architecture.md）を更新してください。

## Development Principles

以下を優先してください。

- 可読性
- 保守性
- 理解しやすさ

過度な抽象化や過剰設計は避けてください。高度な設計よりも理解しやすさを優先してください。

## Architecture Boundary

- backend: 認証・お気に入り・ユーザーデータのCRUDのみ担当（MongoDB）
- fastapi-service: 推薦ロジック・統計計算のみ担当（コサイン類似度、パーセンタイル等）
- 判断基準は「選手の統計データ・特徴量を使う計算かどうか」: ユーザーの嗜好ベクトル生成や類似度計算のように、選手特徴量ベースの計算と組み合わさる処理はfastapi-serviceに置く。ユーザー行動データ単体のCRUD・軽量な集計（一覧取得、件数カウントなど）はbackendに置く。
- FastAPIにMongoDBへの直接アクセスを持たせない。必要なユーザーデータはbackend経由で渡す。
- 新しいロジックを追加するときは、どちらの責務か迷ったら実装前に確認する

## Before Large Changes

実装を始める前に、必ず次の内容を説明し、確認を取ってから着手してください。

- 何を実装するのか
- なぜそうするのか
- 影響範囲
- 実装前にbranchを切ること

確認を取らずに実装を進めないでください。

## Code Organization

1つのファイルにロジックを集中させないでください。責務ごとに分割してください。

- backend: routes → controllers → services → models
- fastapi-service: routers → core

## Module System

- 現在backend/fastapi-serviceともにCommonJS（require/module.exports）を使用している
- 今後ESM（import/export）へ移行する方針（フロントエンドは既にESM）
- 移行は既存の機能開発と混ぜず、専用の作業として区切って実施する（`__dirname`などESM非対応の構文がbackend内に残っている箇所の洗い出し、Jestの設定変更が必要なため）
- 着手する際は対象範囲・タイミングを先に確認する

## Explanation Style

説明するときは以下を重視してください。

- 初学者向け
- なぜその設計なのか
- データの流れ
- 各ファイルの役割
- 面接で説明できるレベル

専門用語はできるだけ分かりやすく説明してください。

## Commands

### Frontend (frontend/)

- 開発サーバー: `npm run dev`
- ビルド: `npm run build`
- Lint: `npm run lint`

### Backend (backend/)

- 開発サーバー: `npm run dev`
- テスト: `npm run test`

### fastAPI (fastapi-service/)

- 開発サーバー: `uvicorn main:app --reload`
- テスト: `pytest`

### 全サービス一括起動

- `docker compose up`
