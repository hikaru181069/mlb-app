const fetchMlbResponse = async (url) => {
  return fetch(url);
};

const fetchFromMlbApi = async (
  url,
  errorMessage = "Failed to fetch MLB Stats API",
) => {
  const response = await fetchMlbResponse(url);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
};

const safelyFetchFromMlbApi = async ({
  url,
  notOkValue = {},
  catchValue = [],
  logMessage = "MLB API fetch error",
}) => {
  try {
    const response = await fetchMlbResponse(url);

    if (!response.ok) {
      return notOkValue;
    }

    return response.json();
  } catch (error) {
    console.error(`${logMessage}:`, error.message);
    return catchValue;
  }
};

module.exports = {
  fetchFromMlbApi,
  fetchMlbResponse,
  safelyFetchFromMlbApi,
};
