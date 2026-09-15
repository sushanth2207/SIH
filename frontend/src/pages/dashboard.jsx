import { useEffect, useState } from "react";
import { Badge } from "react-bootstrap";
import {
  MapContainer,
  Polygon,
  Popup,
  TileLayer,
  ZoomControl,
} from "react-leaflet";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "leaflet/dist/leaflet.css";
import "./Dashboard.css";
import { getDashboardData } from "../services/api";
import { demoHeatZones, riskZoneColors } from "../data/demoHeatZones";
const levelClass = (level) =>
  `risk-${level?.toLowerCase().replace("_", "-") || "moderate"}`;
const displayLevel = (level) => level?.replace("_", " ") || "MODERATE";
const chartColors = {
  VERY_HIGH: "#ff3b4e",
  HIGH: "#ff7200",
  MODERATE: "#ffbc08",
  LOW: "#18b878",
};
function RiskBadge({ level }) {
  return (
    <Badge className={`risk-badge ${levelClass(level)}`}>
      {displayLevel(level)}
    </Badge>
  );
}

function toSpatialZone(geometry, area) {
  if (!geometry || !area) return null;

  return {
    ...geometry,
    areaName: area.name,
    riskLevel: area.riskLevel,
    riskScore: area.riskScore,
    heatIndex: area.heatIndex,
    thermalStress: area.thermalStress,
    population: area.population,
  };
}

function polygonPathOptions(riskLevel, isSelected) {
  const fillColor = riskZoneColors[riskLevel] || riskZoneColors.MODERATE;

  return {
    color: isSelected ? "#fff6e4" : fillColor,
    fillColor,
    fillOpacity: isSelected ? 0.48 : 0.26,
    weight: isSelected ? 2 : 0.4,
    opacity: isSelected ? 0.7 : 0.18,
    lineJoin: "round",
    lineCap: "round",
  };
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hourlyForecast = data?.hourlyForecast || [];
  const [selectedZone, setSelectedZone] = useState(null);
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const dashboardData = await getDashboardData();

        if (!cancelled) {
          setData(dashboardData);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not load dashboard data. Start the backend with npm start in the backend folder (http://localhost:5000), then refresh.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    const refreshInterval = setInterval(
      () => {
        loadDashboard();
      },
      5 * 60 * 1000,
    );

    return () => {
      cancelled = true;
      clearInterval(refreshInterval);
    };
  }, []);
  if (loading)
    return (
      <div className="dashboard-state">
        <div className="loading-orb" />
        <p>Loading HeatGuard dashboard data…</p>
      </div>
    );
  if (error)
    return (
      <div className="dashboard-state">
        <h1>HEATGUARD</h1>
        <p className="error-message">{error}</p>
      </div>
    );

  const { wards, forecast, alerts, analytics, note, currentWeather } = data;
  const riskLevelDistribution = ["VERY_HIGH", "HIGH", "MODERATE", "LOW"].map(
    (riskLevel) => ({
      riskLevel,
      count: hourlyForecast.filter((item) => item.riskLevel === riskLevel)
        .length,
    }),
  );
  const selectedWard =
    wards.find((ward) => ward.areaId === "ward_12") || wards[0];
  const displayedZone =
    selectedZone ||
    toSpatialZone(
      demoHeatZones.find((item) => item.areaId === selectedWard.areaId),
      selectedWard,
    );
  const priorityAreas = [...wards]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);

  const selectSpatialArea = (area) => {
    const zone = toSpatialZone(
      demoHeatZones.find((item) => item.areaId === area.areaId),
      area,
    );

    if (zone) {
      setSelectedZone(zone);
    }
  };
  return (
    <div className="heatguard-shell">
      <header className="heatguard-header">
        <div className="header-copy">
          <h1>Dashboard Overview</h1>
          <p>Real-time heat risk monitoring and prediction system</p>
        </div>
        <div className="header-brand">
          <span className="brand-flame" aria-hidden="true">
            ♨
          </span>
          <div>
            <strong>HEATGUARD</strong>
            <small>Hyderabad</small>
          </div>
        </div>
      </header>
      <main className="heatguard-main">
        <div className="dashboard-layout">
          <div className="dashboard-primary">
            <section className="map-panel heat-panel">
              <div className="panel-heading">
                <div>
                  <h1>Hyderabad Heat Map</h1>
                  <p>
                    Illustrative spatial risk layer — not official ward
                    boundaries
                  </p>
                </div>
              </div>
              <div
                className="heat-map-demo"
                aria-label="Illustrative spatial heat risk map for Hyderabad, not official ward boundaries"
              >
                <MapContainer
                  center={[17.385, 78.4867]}
                  zoom={12}
                  zoomControl={false}
                  className="heatguard-leaflet-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ZoomControl position="topright" />
                  {demoHeatZones.map((geometry) => {
                    const area = wards.find(
                      (item) => item.areaId === geometry.areaId,
                    );
                    const zone = toSpatialZone(geometry, area);

                    if (!zone) return null;

                    const isSelected =
                      (selectedZone?.areaId || displayedZone?.areaId) ===
                      zone.areaId;

                    return (
                      <Polygon
                        key={zone.areaId}
                        positions={zone.coordinates}
                        pathOptions={{
                          ...polygonPathOptions(zone.riskLevel, isSelected),
                          className: isSelected
                            ? "heat-zone-selected"
                            : "heat-zone",
                        }}
                        eventHandlers={{
                          click: () => setSelectedZone(zone),
                          add: (event) => {
                            if (isSelected) {
                              event.target.bringToFront();
                            }
                          },
                        }}
                      >
                        <Popup className="heat-zone-popup">
                          <span className="heat-popup-kicker">
                            Illustrative area
                          </span>
                          <strong>{zone.areaName}</strong>
                          <span className="heat-popup-level">
                            {displayLevel(zone.riskLevel)}
                          </span>
                          <span className="heat-popup-stat">
                            Risk score <b>{zone.riskScore} / 100</b>
                          </span>
                          <span className="heat-popup-stat">
                            Heat index <b>{zone.heatIndex}</b>
                          </span>
                          <span className="heat-popup-stat">
                            Thermal stress <b>{zone.thermalStress} / 100</b>
                          </span>
                          <span className="heat-popup-stat">
                            Population <b>{zone.population}</b>
                          </span>
                          <small>
                            Schematic geometry — not an official ward boundary
                          </small>
                        </Popup>
                      </Polygon>
                    );
                  })}
                </MapContainer>
                <div className="risk-legend">
                  <strong>RISK LEVEL</strong>
                  <span className="legend-caption">Illustrative layer</span>
                  <span>
                    <i className="dot very-high" />
                    Very High
                  </span>
                  <span>
                    <i className="dot high" />
                    High
                  </span>
                  <span>
                    <i className="dot moderate" />
                    Moderate
                  </span>
                  <span>
                    <i className="dot low" />
                    Low
                  </span>
                </div>
                {displayedZone && (
                  <div className="ward-overlay">
                    <div className="ward-title">
                      <div>
                        <small className="selected-zone-label">
                          {selectedZone ? "SELECTED AREA" : "FOCUS AREA"}
                        </small>
                        <strong>{displayedZone.areaName}</strong>
                      </div>
                      <RiskBadge level={displayedZone.riskLevel} />
                    </div>
                    <div>
                      <span>Heat Index</span>
                      <b>{displayedZone.heatIndex}</b>
                    </div>
                    <div>
                      <span>Thermal Stress</span>
                      <b>{displayedZone.thermalStress} / 100</b>
                    </div>
                    <div>
                      <span>Population</span>
                      <b>{displayedZone.population}</b>
                    </div>
                    <div>
                      <span>Risk Score</span>
                      <b className="risk-score">
                        {displayedZone.riskScore} / 100
                      </b>
                    </div>
                    <p className="overlay-caption">Illustrative spatial data</p>
                  </div>
                )}
                <span className="map-demo-label">
                  Illustrative spatial risk layer — not official ward boundaries
                </span>
              </div>
              <div className="map-timeline">
                <span>Ⅱ</span>
                <span>14:00</span>
                <div className="timeline-line">
                  <i />
                </div>
                <span>18:00</span>
                <span>⌁</span>
              </div>
              <div className="map-alert-strip">
                <span>Active Alerts</span>

                {alerts.slice(0, 2).map((alert) => (
                  <span
                    className={`mini-alert ${
                      alert.severity === "CRITICAL" ? "critical" : ""
                    }`}
                    key={alert.id}
                  >
                    ▲ {alert.title}
                  </span>
                ))}

                <span className="system-status">
                  System Status <i />
                </span>
              </div>
            </section>
            <section className="analytics-grid">
              <section className="heat-panel chart-panel">
                <h2>
                  Heat Index Trend (Hyderabad) <small>ML forecast</small>
                </h2>
                <div className="line-chart">
                  <ResponsiveContainer width="100%" height={168}>
                    <LineChart
                      data={hourlyForecast.map((item, index) => ({
                        label:
                          index % 24 === 0
                            ? item.datetime.slice(5, 16).replace("T", " ")
                            : "",
                        heatIndex: item.heatIndex,
                      }))}
                      margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="#253033"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="label"
                        interval={0}
                        tick={{ fill: "#9b9895", fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#9b9895", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        domain={["dataMin - 1", "dataMax + 1"]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111517",
                          border: "1px solid #584224",
                          borderRadius: 4,
                          color: "#f5eee7",
                        }}
                        labelStyle={{ color: "#ffbf08" }}
                        formatter={(value) => [`${value} °C`, "Heat index"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="heatIndex"
                        stroke="#ffa3a0"
                        strokeWidth={2.5}
                        dot={{ fill: "#ffa3a0", r: 2.5, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="heat-panel distribution-panel">
                <h2>
                  Risk Level Distribution <small>ML forecast</small>
                </h2>
                <div className="distribution-content">
                  <div className="distribution-donut">
                    <PieChart width={168} height={168}>
                      <Pie
                        data={riskLevelDistribution}
                        dataKey="count"
                        nameKey="riskLevel"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={76}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {riskLevelDistribution.map((item) => (
                          <Cell
                            fill={chartColors[item.riskLevel]}
                            key={item.riskLevel}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                    <span>HOURS</span>
                  </div>
                  <div className="distribution-list">
                    {analytics.riskLevelDistribution.map((item) => (
                      <span key={item.riskLevel}>
                        <i
                          className={`dot ${levelClass(item.riskLevel).replace("risk-", "")}`}
                        />
                        <em>{displayLevel(item.riskLevel)}</em>
                        <b>{item.count}</b>
                      </span>
                    ))}
                  </div>
                </div>
              </section>
              <section className="heat-panel priority-panel">
                <h2>
                  Top Priority Areas <small>illustrative spatial data</small>
                </h2>
                {priorityAreas.map((area, index) => {
                  const isSelected =
                    (selectedZone?.areaId || displayedZone?.areaId) ===
                    area.areaId;

                  return (
                    <div
                      className={`priority-row ${isSelected ? "is-selected" : ""}`}
                      key={area.areaId}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => selectSpatialArea(area)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectSpatialArea(area);
                        }
                      }}
                    >
                      <b className="priority-rank">
                        {String(index + 1).padStart(2, "0")}
                      </b>
                      <div className="priority-copy">
                        <strong>{area.name}</strong>
                        <small>Illustrative area</small>
                        <div className="priority-metrics">
                          <span>
                            Score <b>{area.riskScore}</b>
                          </span>
                          <span>
                            HI <b>{area.heatIndex}</b>
                          </span>
                          <span>
                            Pop. <b>{area.population}</b>
                          </span>
                        </div>
                      </div>
                      <RiskBadge level={area.riskLevel} />
                    </div>
                  );
                })}
              </section>
            </section>
            <section className="heat-panel insights-panel">
              <div className="insights-header">
                <div className="insights-label">HEATGUARD INSIGHTS</div>
                <small>ML derived</small>
              </div>

              <div className="insights-grid">
                {forecast
                  .filter(
                    (item) =>
                      item.riskLevel === "VERY_HIGH" ||
                      item.riskLevel === "HIGH",
                  )
                  .slice(0, 2)
                  .map((item) => (
                    <div
                      className="insight-item"
                      key={`ml-insight-${item.date}`}
                    >
                      <span className="insight-kicker">{item.day}</span>
                      <p>
                        Forecast at{" "}
                        <strong>{item.riskLevel.replace("_", " ")}</strong> heat
                        risk with a risk score of{" "}
                        <strong>{item.riskScore}/100</strong>. Heat Index is
                        expected to reach <strong>{item.heatIndex} °C</strong>.
                      </p>
                    </div>
                  ))}
              </div>
            </section>
            <p className="data-disclaimer">
              {note} The Hyderabad map and Top Priority Areas use an
              illustrative spatial layer — not official ward boundaries and not
              ward-level ML predictions.
            </p>
          </div>
          <aside className="right-rail">
            <section className="heat-panel weather-panel">
              <h2>
                Current Weather <small>live</small>
              </h2>

              <div className="current-weather-card">
                <div className="current-weather-main">
                  <div>
                    <strong>Hyderabad</strong>
                    <small>Live conditions</small>
                  </div>

                  <b className="weather-temp">
                    {currentWeather.temperature}
                    <span>°C</span>
                  </b>
                </div>

                <div className="current-weather-metrics">
                  <span>
                    Humidity
                    <b>{currentWeather.relativeHumidity}%</b>
                  </span>

                  <span>
                    Wet Bulb
                    <b>{currentWeather.wetBulbTemperature} °C</b>
                  </span>

                  <span>
                    Wind
                    <b>{currentWeather.windSpeed.toFixed(1)} m/s</b>
                  </span>

                  <span>
                    Solar Radiation
                    <b>{currentWeather.solarRadiation} W/m²</b>
                  </span>
                </div>
              </div>
            </section>
            <section className="heat-panel forecast-panel">
              <h2>
                3-Day Heat Risk Forecast <small>ML forecast</small>
              </h2>

              {forecast.map((item, index) => (
                <div
                  className={`forecast-card ${
                    index === 1 ? "forecast-emphasis" : ""
                  }`}
                  key={item.day}
                >
                  <div>
                    <strong>{item.day}</strong>
                    <small>{item.date}</small>
                  </div>

                  <RiskBadge level={item.riskLevel} />

                  <div className="forecast-metrics">
                    <span>
                      Temp <b>{item.temperature} °C</b>
                    </span>

                    <span>
                      Heat Index <b>{item.heatIndex} °C</b>
                    </span>

                    <span>
                      WBGT <b>{item.estimatedWBGT} °C</b>
                    </span>

                    <span>
                      Risk <b>{item.riskScore}</b>
                    </span>
                  </div>
                </div>
              ))}
            </section>
            <section className="heat-panel alerts-panel">
              <h2>
                Heat Risk Alerts <small>ML generated</small>
              </h2>

              <div className="alerts-list">
                {forecast
                  .filter(
                    (item) =>
                      item.riskLevel === "VERY_HIGH" ||
                      item.riskLevel === "HIGH",
                  )
                  .map((item) => (
                    <article
                      className={`warning-card alert-${
                        item.riskLevel === "VERY_HIGH" ? "critical" : "high"
                      }`}
                      key={`forecast-alert-${item.date}`}
                    >
                      <div className="alert-heading">
                        <strong>
                          {item.riskLevel === "VERY_HIGH"
                            ? "Very High Heat Risk Expected"
                            : "High Heat Risk Expected"}
                        </strong>

                        <span className="alert-severity">
                          {displayLevel(item.riskLevel)}
                        </span>
                      </div>

                      <span className="alert-when">
                        {item.day} · {item.date}
                      </span>

                      <p>
                        Predicted risk score:{" "}
                        <strong>{item.riskScore}/100</strong>
                        <span className="alert-sep">·</span>
                        Heat Index: <strong>{item.heatIndex} °C</strong>
                        <span className="alert-sep">·</span>
                        Estimated WBGT: <strong>{item.estimatedWBGT} °C</strong>
                      </p>
                    </article>
                  ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
export default Dashboard;
