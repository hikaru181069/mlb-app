import { API_URL } from "../../utils/apiConfig";

export const getRecommendations = async (token) => {
  if (!token) {
    return [];
  }

  const response = await fetch(`${API_URL}/api/recommendations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load recommendations.");
  }

  return data;
};
