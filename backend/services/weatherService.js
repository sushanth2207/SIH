const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/era5";

const HYDERABAD = {
  latitude: 17.385,
  longitude: 78.4867,
};

async function getCurrentWeather() {
  const params = new URLSearchParams({
    latitude: HYDERABAD.latitude,
    longitude: HYDERABAD.longitude,
    hourly:
      "temperature_2m,relative_humidity_2m,wet_bulb_temperature_2m,wind_speed_10m,shortwave_radiation",
    timezone: "Asia/Kolkata",
    forecast_days: "1",
  });

  const response = await fetch(`${OPEN_METEO_FORECAST_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  return response.json();
}

async function getForecastWeather() {
  const params = new URLSearchParams({
    latitude: HYDERABAD.latitude,
    longitude: HYDERABAD.longitude,
    hourly:
      "temperature_2m,relative_humidity_2m,wet_bulb_temperature_2m,wind_speed_10m,shortwave_radiation",
    timezone: "Asia/Kolkata",
    forecast_days: "3",
  });

  const response = await fetch(`${OPEN_METEO_FORECAST_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Open-Meteo forecast request failed: ${response.status}`);
  }

  return response.json();
}

async function getHistoricalWeather(startDate, endDate) {
  const params = new URLSearchParams({
    latitude: HYDERABAD.latitude,
    longitude: HYDERABAD.longitude,
    start_date: startDate,
    end_date: endDate,
    hourly:
      "temperature_2m,relative_humidity_2m,wet_bulb_temperature_2m,wind_speed_10m,shortwave_radiation",
    timezone: "Asia/Kolkata",
  });

  const response = await fetch(`${OPEN_METEO_ARCHIVE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Open-Meteo historical request failed: ${response.status}`);
  }

  return response.json();
}

function prepareWeatherForML(weatherData) {
  const hourly = weatherData.hourly;

  return hourly.time.map((datetime, index) => ({
    datetime,
    temperature: hourly.temperature_2m[index],
    relative_humidity: hourly.relative_humidity_2m[index],
    wet_bulb_temperature: hourly.wet_bulb_temperature_2m[index],

    // Ritvik's model expects m/s.
    // Open-Meteo provides km/h.
    wind_speed: hourly.wind_speed_10m[index] / 3.6,

    solar_radiation_wm2: hourly.shortwave_radiation[index],
  }));
}

function prepareForecastForML(weatherData) {
  return prepareWeatherForML(weatherData);
}

module.exports = {
  getCurrentWeather,
  getForecastWeather,
  getHistoricalWeather,
  prepareWeatherForML,
  prepareForecastForML,
};
