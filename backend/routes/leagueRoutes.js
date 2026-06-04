const express = require("express");
const { getStandings, getScores } = require("../controllers/leagueController");

const router = express.Router();

// GET /api/league/standings?season=YYYY
router.get("/standings", getStandings);
// GET /api/league/scores?date=YYYY-MM-DD
router.get("/scores", getScores);

module.exports = router;
