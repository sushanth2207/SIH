require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");

const {
  getCurrentWeather,
  getHistoricalWeather,
  getForecastWeather,
  prepareWeatherForML,
  prepareForecastForML,
} = require("./services/weatherService");

const { getDashboardForecast } = require("./services/mlService");
const { shouldSendSms, markSmsSent } = require("./services/alertService");
const { sendHeatAlert } = require("./services/twilioService");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SIH Heat Warning API is running",
  });
});

app.get("/api/weather", async (req, res) => {
  try {
    const weather = await getCurrentWeather();

    res.json({
      dataType: "live_weather",
      location: "Hyderabad",
      weather,
    });
  } catch (error) {
    console.error("Weather API error:", error);

    res.status(502).json({
      error: "Unable to fetch weather data",
    });
  }
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const forecastWeather = await getForecastWeather();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (date) => date.toISOString().split("T")[0];

    const historicalWeather = await getHistoricalWeather(
      formatDate(startDate),
      formatDate(endDate),
    );

    const historicalForML = prepareWeatherForML(historicalWeather);
    const forecastForML = prepareForecastForML(forecastWeather);

    const mlForecast = await getDashboardForecast(
      historicalForML,
      forecastForML,
    );

    console.log("ML FORECAST RESULT:", JSON.stringify(mlForecast, null, 2));
    const todayRiskLevel = mlForecast.daily.today.riskLevel;

    if (shouldSendSms(todayRiskLevel)) {
      try {
        await sendHeatAlert(
          `HeatGuard Alert: VERY HIGH thermal risk detected for Hyderabad. Please take immediate heat-safety precautions.`,
        );

        markSmsSent();

        console.log("HeatGuard VERY_HIGH SMS sent.");
      } catch (smsError) {
        console.error("HeatGuard SMS failed:", smsError.message);
      }
    }

    const weather = await getCurrentWeather();
    const currentHour = new Date().getHours();

    const currentIndex = weather.hourly.time.findIndex((time) => {
      return Number(time.slice(11, 13)) === currentHour;
    });

    const weatherIndex = currentIndex >= 0 ? currentIndex : 0;
    res.json({
      dataType: "ml_forecast",
      note: "Forecast values are generated from live weather data and the HeatGuard ML prediction pipeline.",

      currentWeather: {
        temperature: weather.hourly.temperature_2m[weatherIndex],
        relativeHumidity: weather.hourly.relative_humidity_2m[weatherIndex],
        wetBulbTemperature:
          weather.hourly.wet_bulb_temperature_2m[weatherIndex],
        windSpeed: weather.hourly.wind_speed_10m[weatherIndex] / 3.6,
        solarRadiation: weather.hourly.shortwave_radiation[weatherIndex],
        timestamp: weather.hourly.time[weatherIndex],
      },
      summary: {
        highRiskZoneCount: 4,
        thermalStress: "HIGH",
        activeAlertCount: 2,
      },
      wards: [
        {
          areaId: "ward_03",
          name: "Ward 3",
          riskScore: 81,
          riskLevel: "VERY_HIGH",
          thermalStress: 79,
          heatIndex: "44.7 °C",
          population: "45,231",
        },
        {
          areaId: "ward_07",
          name: "Ward 7",
          riskScore: 76,
          riskLevel: "HIGH",
          thermalStress: 71,
          heatIndex: "42.3 °C",
          population: "38,740",
        },
        {
          areaId: "ward_12",
          name: "Ward 12",
          riskScore: 64,
          riskLevel: "MODERATE",
          thermalStress: 58,
          heatIndex: "39.8 °C",
          population: "29,615",
        },
        {
          areaId: "ward_18",
          name: "Ward 18",
          riskScore: 38,
          riskLevel: "LOW",
          thermalStress: 31,
          heatIndex: "34.6 °C",
          population: "51,408",
        },
        {
          areaId: "ward_21",
          name: "Ward 21",
          riskScore: 72,
          riskLevel: "HIGH",
          thermalStress: 69,
          heatIndex: "41.5 °C",
          population: "42,180",
        },
      ],
      forecast: [
        {
          day: "Today",
          date: mlForecast.daily.today.date,
          riskLevel: mlForecast.daily.today.riskLevel,
          temperature: mlForecast.daily.today.maxTemperature,
          heatIndex: mlForecast.daily.today.heatIndex,
          estimatedWBGT: mlForecast.daily.today.estimatedWBGT,
          riskScore: mlForecast.daily.today.riskScore,
          averageRiskScore: mlForecast.daily.today.averageRiskScore,
        },
        {
          day: "Tomorrow",
          date: mlForecast.daily.tomorrow.date,
          riskLevel: mlForecast.daily.tomorrow.riskLevel,
          temperature: mlForecast.daily.tomorrow.maxTemperature,
          heatIndex: mlForecast.daily.tomorrow.heatIndex,
          estimatedWBGT: mlForecast.daily.tomorrow.estimatedWBGT,
          riskScore: mlForecast.daily.tomorrow.riskScore,
          averageRiskScore: mlForecast.daily.tomorrow.averageRiskScore,
        },
        {
          day: "Day +2",
          date: mlForecast.daily.day2.date,
          riskLevel: mlForecast.daily.day2.riskLevel,
          temperature: mlForecast.daily.day2.maxTemperature,
          heatIndex: mlForecast.daily.day2.heatIndex,
          estimatedWBGT: mlForecast.daily.day2.estimatedWBGT,
          riskScore: mlForecast.daily.day2.riskScore,
          averageRiskScore: mlForecast.daily.day2.averageRiskScore,
        },
      ],

      hourlyForecast: mlForecast.hourly,
      alerts: [
        {
          id: "demo-alert-extreme-heat",
          severity: "CRITICAL",
          title: "Extreme Heat Warning",
          message:
            "Synthetic demo alert: very high heat-stress conditions are expected during peak afternoon hours.",
          affectedZones: ["Ward 3", "Ward 7"],
        },
        {
          id: "demo-alert-thermal-stress",
          severity: "HIGH",
          title: "Elevated Thermal Stress Advisory",
          message:
            "Synthetic demo alert: use additional heat-safety precautions in the affected demo zones.",
          affectedZones: ["Ward 12"],
        },
      ],
      analytics: {
        dataType: "synthetic_demo",
        heatIndexTrend: [
          { label: "24 May", heatIndex: 38.6 },
          { label: "25 May", heatIndex: 39.1 },
          { label: "26 May", heatIndex: 37.9 },
          { label: "28 May", heatIndex: 40.5 },
          { label: "29 May", heatIndex: 39.8 },
          { label: "30 May", heatIndex: 41.2 },
        ],
        riskLevelDistribution: [
          { riskLevel: "VERY_HIGH", count: 1 },
          { riskLevel: "HIGH", count: 2 },
          { riskLevel: "MODERATE", count: 1 },
          { riskLevel: "LOW", count: 1 },
        ],
      },
      insights: {
        dataType: "synthetic_demo",
        items: [
          {
            id: "demo-insight-1",
            type: "RECOMMENDATION",
            message:
              "Issue heat-safety communication for outdoor workers in Ward 3 and Ward 7.",
          },
          {
            id: "demo-insight-2",
            type: "RECOMMENDATION",
            message:
              "Prepare cooling centres in high-risk areas with vulnerable populations.",
          },
        ],
      },
    });
  } catch (error) {
    console.error("Dashboard weather error:", error);

    res.status(502).json({
      error: "Dashboard weather service is temporarily unavailable.",
      details: error.message,
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
