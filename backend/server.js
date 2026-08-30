const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SIH Heat Warning API is running",
  });
});

app.get("/api/dashboard", (req, res) => {
  res.json({
    dataType: "synthetic_demo",
    note: "Synthetic/demo data for frontend–backend wiring. Not real weather observations or ML predictions.",
    summary: {
      highRiskZoneCount: 4,
      thermalStress: "HIGH",
      activeAlertCount: 2,
    },
    wards: [
      {
        areaId: "ward_03",
        name: "Ward 3",
        riskScore: 88,
        riskLevel: "VERY_HIGH",
        thermalStress: 84,
      },
      {
        areaId: "ward_07",
        name: "Ward 7",
        riskScore: 76,
        riskLevel: "HIGH",
        thermalStress: 71,
      },
      {
        areaId: "ward_12",
        name: "Ward 12",
        riskScore: 81,
        riskLevel: "VERY_HIGH",
        thermalStress: 79,
      },
      {
        areaId: "ward_18",
        name: "Ward 18",
        riskScore: 64,
        riskLevel: "MODERATE",
        thermalStress: 58,
      },
      {
        areaId: "ward_21",
        name: "Ward 21",
        riskScore: 72,
        riskLevel: "HIGH",
        thermalStress: 69,
      },
    ],
    forecast: [
      { day: "Today", date: "30 May", riskLevel: "HIGH", temperatureRange: "41 – 43 °C", icon: "☀" },
      { day: "Tomorrow", date: "31 May", riskLevel: "VERY_HIGH", temperatureRange: "43 – 45 °C", icon: "♨" },
      { day: "Day +2", date: "1 Jun", riskLevel: "HIGH", temperatureRange: "42 – 44 °C", icon: "◒" },
    ],
    alerts: [
      {
        id: "demo-alert-extreme-heat",
        severity: "CRITICAL",
        title: "Extreme Heat Warning",
        message: "Synthetic demo alert: very high heat-stress conditions are expected during peak afternoon hours.",
        affectedZones: ["Old City Demo Zone", "Malakpet Demo Zone"],
      },
      {
        id: "demo-alert-thermal-stress",
        severity: "HIGH",
        title: "Elevated Thermal Stress Advisory",
        message: "Synthetic demo alert: use additional heat-safety precautions in the affected demo zones.",
        affectedZones: ["Raidurg Demo Zone"],
      },
    ],
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
