const express = require("express");

const { searchExternalPlayers } = require("../controllers/externalPlayerController");

const router = express.Router();

router.get("/search", searchExternalPlayers);

module.exports = router;
