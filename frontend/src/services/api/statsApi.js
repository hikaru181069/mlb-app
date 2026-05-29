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
