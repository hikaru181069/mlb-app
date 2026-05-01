const express = require("express");

const router = express.Router();

const {
  getPlayers,
  createPlayer,
  searchPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
} = require("../controllers/playerController");

router.get("/", getPlayers);
router.post("/", createPlayer);
router.get("/search", searchPlayers);
router.get("/:id", getPlayerById);
router.put("/:id", updatePlayer);
router.delete("/:id", deletePlayer);

module.exports = router;
