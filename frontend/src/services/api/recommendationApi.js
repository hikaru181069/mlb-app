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
    const error = new Error(data.message || "Failed to load recommendations.");
    error.status = response.status;
    throw error;
  }

  return data;
};

export const getFutureStars = async (token) => {
  if (!token) {
    return [];
  }

  const response = await fetch(`${API_URL}/api/recommendations/future-stars`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.message || "Failed to load future stars recommendations.",
    );
    error.status = response.status;
    throw error;
  }

  return data.futureStars || [];
};
