const express = require("express");
const { getLeaders } = require("../controllers/statsController");

const router = express.Router();

router.get("/leaders", getLeaders);

module.exports = router;

// 年度別成績（statsRoutes に追加）
