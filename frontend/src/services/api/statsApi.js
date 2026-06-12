import { API_URL } from "../../utils/apiConfig";

export const getLeaders = async ({ type = "hitting", limit = 10 } = {}) => {
  const params = new URLSearchParams({ type, limit: String(limit) });
  const response = await fetch(`${API_URL}/api/stats/leaders?${params}`);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Failed to fetch stats leaders.");
    error.status = response.status;
    throw error;
  }

  return data;
};

export const getHotPlayers = async ({ days = 14 } = {}) => {
  const params = new URLSearchParams({ days: String(days) });
  const response = await fetch(`${API_URL}/api/stats/hot?${params}`);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Failed to fetch hot players.");
    error.status = response.status;
    throw error;
  }

  return data;
};
