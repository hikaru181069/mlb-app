import { API_URL } from "../../utils/apiConfig";

/**
 * 類似選手リストを取得する
 * FastAPI → Express → フロントエンド の順でデータが流れる
 */
export const getSimilarPlayers = async (playerId) => {
  const response = await fetch(`${API_URL}/api/similar-players/${playerId}`);

  if (!response.ok) {
    return []; // エラー時は空配列（Similar Players は補助的な機能のため）
  }

  return response.json();
};
