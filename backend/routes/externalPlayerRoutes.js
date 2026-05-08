const express = require("express");

const {
  getExternalPlayerById,
  searchExternalPlayers,
} = require("../controllers/externalPlayerController");

const router = express.Router();

router.get("/search", searchExternalPlayers);
router.get("/:playerId", getExternalPlayerById);

module.exports = router;
