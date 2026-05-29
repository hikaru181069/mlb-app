const express = require("express");
const { getLeaders } = require("../controllers/statsController");

const router = express.Router();

router.get("/leaders", getLeaders);

module.exports = router;
