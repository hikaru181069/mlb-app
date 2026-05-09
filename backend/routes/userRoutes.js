const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  completeOnboarding,
  getMe,
  updateFavoriteTeam,
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", protect, getMe);
router.patch("/me/favorite-team", protect, updateFavoriteTeam);
router.patch("/me/onboarding-complete", protect, completeOnboarding);

module.exports = router;
