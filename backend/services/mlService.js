const ML_API_URL = "http://127.0.0.1:8000";

async function getDashboardForecast(historicalWeather, forecastWeather) {
  const response = await fetch(`${ML_API_URL}/dashboard-forecast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      historicalWeather,
      forecastWeather,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`ML API request failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  return {
    daily: result.daily,
    hourly: result.hourly || [],
  };
}

async function getWardPrediction(historicalWeather, currentWeather) {
  const response = await fetch(`${ML_API_URL}/ward-prediction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      historicalWeather,
      currentWeather,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ward ML API request failed (${response.status}): ${errorText}`,
    );
  }

  return response.json();
}

async function getWardPredictionsBatch(wards) {
  const response = await fetch(`${ML_API_URL}/ward-predictions-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      wards,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ward batch ML API request failed (${response.status}): ${errorText}`,
    );
  }

  return response.json();
}

module.exports = {
  getDashboardForecast,
  getWardPrediction,
  getWardPredictionsBatch,
};
