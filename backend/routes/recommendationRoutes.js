const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getFutureStars,
  getRecommendations,
  getQuizRecommendations,
  getProspectRecommendations,
} = require("../controllers/recommendationController");

const router = express.Router();

router.get("/future-stars", protect, getFutureStars);
router.get("/quiz", protect, getQuizRecommendations);
router.get("/prospects", protect, getProspectRecommendations);
router.get("/", protect, getRecommendations);

module.exports = router;
