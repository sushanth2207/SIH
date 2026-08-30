// Synthetic polygons created solely for the HeatGuard UI demo.
// They are not official Hyderabad ward boundaries or real risk observations.
export const demoHeatZones = [
  {
    id: "demo-old-city",
    wardName: "Old City Demo Zone",
    riskLevel: "VERY_HIGH",
    riskScore: 81,
    heatIndex: "44.7 °C",
    thermalStress: 79,
    population: "45,231",
    coordinates: [[17.354, 78.455], [17.354, 78.475], [17.369, 78.475], [17.369, 78.455]],
  },
  {
    id: "demo-malakpet",
    wardName: "Malakpet Demo Zone",
    riskLevel: "HIGH",
    riskScore: 76,
    heatIndex: "42.3 °C",
    thermalStress: 71,
    population: "38,740",
    coordinates: [[17.366, 78.492], [17.366, 78.512], [17.381, 78.512], [17.381, 78.492]],
  },
  {
    id: "demo-raidurg",
    wardName: "Raidurg Demo Zone",
    riskLevel: "MODERATE",
    riskScore: 64,
    heatIndex: "39.8 °C",
    thermalStress: 58,
    population: "29,615",
    coordinates: [[17.423, 78.365], [17.423, 78.388], [17.439, 78.388], [17.439, 78.365]],
  },
  {
    id: "demo-secunderabad",
    wardName: "Secunderabad Demo Zone",
    riskLevel: "LOW",
    riskScore: 38,
    heatIndex: "34.6 °C",
    thermalStress: 31,
    population: "51,408",
    coordinates: [[17.438, 78.485], [17.438, 78.507], [17.454, 78.507], [17.454, 78.485]],
  },
];

export const riskZoneColors = {
  VERY_HIGH: "#ff3b4e",
  HIGH: "#ff7200",
  MODERATE: "#ffbc08",
  LOW: "#18b878",
};
