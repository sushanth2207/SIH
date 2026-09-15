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

  // Python API returns:
  // {
  //   daily: { today, tomorrow, day2 },
  //   hourly: [...]
  // }

  return {
    daily: result.daily,
    hourly: result.hourly || [],
  };
}

module.exports = {
  getDashboardForecast,
};
