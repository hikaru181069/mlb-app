const express = require("express");
const { getGame } = require("../controllers/gameController");

const router = express.Router();

// GET /api/games/:gamePk → 1試合の詳細（メタ + linescore + boxscore）
router.get("/:gamePk", getGame);

module.exports = router;
