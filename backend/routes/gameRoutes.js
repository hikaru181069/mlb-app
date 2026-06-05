const express = require("express");
const { getGame, getGamePlays } = require("../controllers/gameController");

const router = express.Router();

router.get("/:gamePk/plays", getGamePlays);
router.get("/:gamePk", getGame);

module.exports = router;
