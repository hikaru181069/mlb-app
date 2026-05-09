const express = require("express");

const {
  getExternalPlayerById,
  getExternalPlayersByTeam,
  searchExternalPlayers,
} = require("../controllers/externalPlayerController");

const router = express.Router();

router.get("/search", searchExternalPlayers);
router.get("/teams/:teamId/players", getExternalPlayersByTeam);
router.get("/:playerId", getExternalPlayerById);

module.exports = router;
