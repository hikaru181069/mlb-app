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
