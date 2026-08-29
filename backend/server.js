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
      { day: "Today", riskLevel: "HIGH" },
      { day: "Tomorrow", riskLevel: "VERY_HIGH" },
      { day: "Day +2", riskLevel: "HIGH" },
    ],
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
