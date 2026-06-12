const express = require("express");
const { getLeaders, getHotPlayers } = require("../controllers/statsController");

const router = express.Router();

router.get("/leaders", getLeaders);
router.get("/hot", getHotPlayers);

module.exports = router;

// 年度別成績（statsRoutes に追加）
