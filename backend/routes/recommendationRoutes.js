const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getFutureStars,
  getRecommendations,
  getQuizRecommendations,
} = require("../controllers/recommendationController");

const router = express.Router();

router.get("/future-stars", protect, getFutureStars);
router.get("/quiz", protect, getQuizRecommendations);
router.get("/", protect, getRecommendations);

module.exports = router;
