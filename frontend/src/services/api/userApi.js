import { API_URL } from "../../utils/apiConfig";

const createAuthHeaders = (token) => {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_URL}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Failed to load user.");
    error.status = response.status;
    throw error;
  }

  return data;
};

export const updateFavoriteTeam = async (favoriteTeam, token) => {
  const response = await fetch(`${API_URL}/api/users/me/favorite-team`, {
    method: "PATCH",
    headers: createAuthHeaders(token),
    body: JSON.stringify({ favoriteTeam }),
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Failed to update favorite team.");
    error.status = response.status;
    throw error;
  }

  return data;
};

export const completeOnboarding = async (token) => {
  const response = await fetch(`${API_URL}/api/users/me/onboarding-complete`, {
    method: "PATCH",
    headers: createAuthHeaders(token),
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Failed to complete onboarding.");
    error.status = response.status;
    throw error;
  }

  return data;
};
