import { API_URL } from "../../utils/apiConfig";

export const searchExternalPlayers = async (searchText) => {
  const response = await fetch(
    `${API_URL}/api/external/players/search?q=${encodeURIComponent(
      searchText,
    )}`,
  );
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Failed to search external players.");
    error.status = response.status;
    throw error;
  }

  return data;
};

export const getExternalPlayerDetail = async (mlbPlayerId) => {
  const response = await fetch(`${API_URL}/api/external/players/${mlbPlayerId}`);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Failed to load external player.");
    error.status = response.status;
    throw error;
  }

  return data;
};

export const getExternalPlayersByTeam = async (teamId) => {
  const response = await fetch(
    `${API_URL}/api/external/players/team/${teamId}`,
  );
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Failed to load team players.");
    error.status = response.status;
    throw error;
  }

  return data;
};

// [Suggestions] 入力中の候補を取得する軽量API呼び出し
// searchExternalPlayers との違い: 統計・詳細情報を含まないため高速
// エラー時は throw せず空配列を返す（候補が出なくても検索自体は続けられるため）
export const fetchPlayerSuggestions = async (searchText) => {
  const response = await fetch(
    `${API_URL}/api/external/players/suggestions?q=${encodeURIComponent(searchText)}`,
  );
  const data = await response.json();

  // 候補取得は補助的な機能なので、失敗してもエラーを throw しない
  if (!response.ok) {
    return [];
  }

  return data;
};

export const getOnboardingPlayers = async () => {
  const response = await fetch(`${API_URL}/api/external/players/popular`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load onboarding players.");
  }
  return data;
};

export const getRecommendedPlayersByTeam = async (teamId) => {
  const response = await fetch(
    `${API_URL}/api/external/players/team/${teamId}/recommended`,
  );
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.message || "Failed to load recommended team players.",
    );
    error.status = response.status;
    throw error;
  }

  return data;
};
