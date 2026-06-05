const express = require("express");

const {
  getExternalPlayerById,
  getExternalPlayersByTeam,
  getRecommendedPlayersByTeam,
  searchExternalPlayers,
  getPlayerSuggestions,
  getPlayerYearByYear,
} = require("../controllers/externalPlayerController");

const router = express.Router();

router.get("/search", searchExternalPlayers);

// [Suggestions] 候補取得エンドポイント
// ⚠️ /:playerId より前に定義する必要がある
// Express はルートを上から順に評価するため、後ろに書くと
// "/suggestions" が /:playerId にマッチしてしまう
router.get("/suggestions", getPlayerSuggestions);

router.get("/team/:teamId/recommended", getRecommendedPlayersByTeam);
router.get("/team/:teamId", getExternalPlayersByTeam);
router.get("/teams/:teamId/players", getExternalPlayersByTeam);
router.get("/:playerId/year-by-year", getPlayerYearByYear);
router.get("/:playerId", getExternalPlayerById);

module.exports = router;
