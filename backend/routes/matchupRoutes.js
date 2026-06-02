const express = require("express");
const { getMatchupStats } = require("../controllers/matchupController");

const router = express.Router();

// GET /api/matchup?pitcherId=X&batterId=Y
router.get("/", getMatchupStats);

module.exports = router;
