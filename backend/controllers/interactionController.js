const { logInteraction } = require("../services/interactionService");

// 選手詳細ページの閲覧を記録する(お気に入り追加は favoriteController 側で記録済み)。
const recordInteraction = async (req, res) => {
  const { mlbPlayerId, playerType, action, source } = req.body;

  if (!mlbPlayerId || action !== "view") {
    return res.status(400).json({ message: "Invalid interaction" });
  }

  await logInteraction({
    userId: req.user._id,
    mlbPlayerId,
    playerType,
    action,
    source: source || "detail",
  });

  res.status(204).end();
};

module.exports = { recordInteraction };
