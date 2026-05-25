const {
  fetchExternalPlayerFullDetails,
  fetchExternalPlayersByTeam,
  fetchRecommendedPlayersByTeam,
  fetchExternalPlayers,
  fetchPlayerSuggestions, // [Suggestions] 候補取得サービス
} = require("../services/mlb");

const searchExternalPlayers = async (req, res) => {
  try {
    const searchText = req.query.q || "";

    if (!searchText.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const players = await fetchExternalPlayers(searchText);

    res.json(players);
  } catch (error) {
    console.error("External player search error:", error.message);
    res.status(500).json({ message: "Failed to search external players" });
  }
};

const getExternalPlayerById = async (req, res) => {
  try {
    const player = await fetchExternalPlayerFullDetails(req.params.playerId);

    res.json(player);
  } catch (error) {
    console.error("External player detail error:", error.message);
    res.status(500).json({ message: "Failed to fetch external player" });
  }
};

const getExternalPlayersByTeam = async (req, res) => {
  try {
    const players = await fetchExternalPlayersByTeam(req.params.teamId);

    res.json(players);
  } catch (error) {
    console.error("External team players error:", error.message);
    res.status(500).json({ message: "Failed to fetch team players" });
  }
};

const getRecommendedPlayersByTeam = async (req, res) => {
  try {
    const players = await fetchRecommendedPlayersByTeam(req.params.teamId, {
      limit: 12,
      hitterLimit: 8,
      pitcherLimit: 4,
    });

    res.json(players);
  } catch (error) {
    console.error("Recommended team players error:", error.message);
    res.status(500).json({ message: "Failed to fetch recommended players" });
  }
};

// [Suggestions] 入力中の候補を返すハンドラー
// GET /api/external/players/suggestions?q=<searchText>
// searchExternalPlayers との違い: 統計・詳細を取得しない軽量レスポンス
// 2文字未満は空配列を返す（MLB API が結果を返さないため、エラーにしない）
const getPlayerSuggestions = async (req, res) => {
  try {
    const searchText = req.query.q || "";

    // バリデーション: 空または1文字の場合はエラーにせず空配列を返す
    // フロントエンド側でも同じ制限をかけているが、APIとしても安全に処理する
    if (!searchText.trim() || searchText.trim().length < 2) {
      return res.json([]);
    }

    const suggestions = await fetchPlayerSuggestions(searchText);
    res.json(suggestions);
  } catch (error) {
    console.error("Player suggestions error:", error.message);
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};

module.exports = {
  getExternalPlayersByTeam,
  getRecommendedPlayersByTeam,
  searchExternalPlayers,
  getExternalPlayerById,
  getPlayerSuggestions, // [Suggestions] 候補表示用
};
