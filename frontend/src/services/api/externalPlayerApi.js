import { API_URL } from "../../utils/apiConfig";

export const searchExternalPlayers = async (searchText) => {
  const response = await fetch(
    `${API_URL}/api/external/players/search?q=${encodeURIComponent(
      searchText,
    )}`,
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to search external players.");
  }

  return data;
};

export const getExternalPlayerDetail = async (mlbPlayerId) => {
  const response = await fetch(`${API_URL}/api/external/players/${mlbPlayerId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load external player.");
  }

  return data;
};

export const getExternalPlayersByTeam = async (teamId) => {
  const response = await fetch(
    `${API_URL}/api/external/players/teams/${teamId}/players`,
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load team players.");
  }

  return data;
};
