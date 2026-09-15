import { useEffect, useState } from "react";
import { Badge } from "react-bootstrap";
import {
  CircleMarker,
  MapContainer,
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
import { getDashboardData, getLiveWardPredictions } from "../services/api";

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

function Dashboard() {
  const [data, setData] = useState(null);
  const [wardPredictions, setWardPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedZone, setSelectedZone] = useState(null);

  const hourlyForecast = data?.hourlyForecast || [];

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [dashboardData, wardData] = await Promise.all([
          getDashboardData(),
          getLiveWardPredictions(),
        ]);

        if (!cancelled) {
          setData(dashboardData);
          setWardPredictions(wardData.wards || []);
          setError("");
        }
      } catch (loadError) {
        console.error(loadError);

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

  if (loading) {
    return (
      <div className="dashboard-state">
        <div className="loading-orb" />
        <p>Loading HeatGuard dashboard data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-state">
        <h1>HEATGUARD</h1>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  const { forecast, alerts, analytics, note, currentWeather } = data;

  const liveWards = wardPredictions.map((ward) => ({
    areaId: `ward_${ward.ward_id}`,
    name: ward.ward_name,
    riskScore: ward.prediction.riskScore,
    riskLevel: ward.prediction.riskLevel,
    thermalStress: ward.prediction.HTSI,
    heatIndex: `${ward.prediction.heatIndex} °C`,
    population: ward.population,
    latitude: ward.latitude,
    longitude: ward.longitude,
    HTSI: ward.prediction.HTSI,
    estimatedWBGT: ward.prediction.estimatedWBGT,
  }));

  const selectedWard = liveWards[0];

  const displayedZone = selectedZone || selectedWard;

  const priorityAreas = [...liveWards]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);

  const riskLevelDistribution = ["VERY_HIGH", "HIGH", "MODERATE", "LOW"].map(
    (riskLevel) => ({
      riskLevel,
      count: wardPredictions.filter(
        (ward) => ward.prediction?.riskLevel === riskLevel,
      ).length,
    }),
  );

  const selectSpatialArea = (area) => {
    setSelectedZone(area);
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
                  <p>Live ML thermal-risk predictions at ward locations</p>
                </div>
              </div>

              <div
                className="heat-map-demo"
                aria-label="Live thermal risk predictions for Hyderabad ward locations"
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

                  {liveWards.map((ward) => {
                    const isSelected =
                      (selectedZone?.areaId || displayedZone?.areaId) ===
                      ward.areaId;

                    const fillColor =
                      chartColors[ward.riskLevel] || chartColors.MODERATE;

                    return (
                      <CircleMarker
                        key={ward.areaId}
                        center={[ward.latitude, ward.longitude]}
                        radius={isSelected ? 11 : 7}
                        pathOptions={{
                          color: "#ffffff",
                          fillColor,
                          fillOpacity: isSelected ? 0.9 : 0.7,
                          weight: isSelected ? 2 : 1,
                        }}
                        eventHandlers={{
                          click: () => setSelectedZone(ward),
                        }}
                      >
                        <Popup className="heat-zone-popup">
                          <span className="heat-popup-kicker">
                            Live ward prediction
                          </span>

                          <strong>{ward.name}</strong>

                          <span className="heat-popup-level">
                            {displayLevel(ward.riskLevel)}
                          </span>

                          <span className="heat-popup-stat">
                            Risk score <b>{ward.riskScore} / 100</b>
                          </span>

                          <span className="heat-popup-stat">
                            HTSI <b>{ward.HTSI} / 100</b>
                          </span>

                          <span className="heat-popup-stat">
                            Heat index <b>{ward.heatIndex}</b>
                          </span>

                          <span className="heat-popup-stat">
                            Population <b>{ward.population}</b>
                          </span>

                          <small>
                            Live weather + ML prediction at ward centroid
                          </small>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                <div className="risk-legend">
                  <strong>RISK LEVEL</strong>
                  <span className="legend-caption">Live ward predictions</span>

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
                          {selectedZone ? "SELECTED WARD" : "FOCUS WARD"}
                        </small>

                        <strong>{displayedZone.name}</strong>
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

                    <p className="overlay-caption">
                      Live ML prediction at ward centroid
                    </p>
                  </div>
                )}

                <span className="map-demo-label">
                  Point locations represent ward centroids; official ward
                  boundaries are not displayed.
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
                      margin={{
                        top: 12,
                        right: 8,
                        left: -22,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="#253033"
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="label"
                        interval={0}
                        tick={{
                          fill: "#9b9895",
                          fontSize: 9,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        tick={{
                          fill: "#9b9895",
                          fontSize: 10,
                        }}
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
                        labelStyle={{
                          color: "#ffbf08",
                        }}
                        formatter={(value) => [`${value} °C`, "Heat index"]}
                      />

                      <Line
                        type="monotone"
                        dataKey="heatIndex"
                        stroke="#ffa3a0"
                        strokeWidth={2.5}
                        dot={{
                          fill: "#ffa3a0",
                          r: 2.5,
                          strokeWidth: 0,
                        }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="heat-panel distribution-panel">
                <h2>
                  Risk Level Distribution <small>155 live wards</small>
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

                    <span>WARDS</span>
                  </div>

                  <div className="distribution-list">
                    {riskLevelDistribution.map((item) => (
                      <span key={item.riskLevel}>
                        <i
                          className={`dot ${levelClass(item.riskLevel).replace(
                            "risk-",
                            "",
                          )}`}
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
                  Top Priority Areas <small>live ward predictions</small>
                </h2>

                {priorityAreas.map((area, index) => {
                  const isSelected =
                    (selectedZone?.areaId || displayedZone?.areaId) ===
                    area.areaId;

                  return (
                    <div
                      className={`priority-row ${
                        isSelected ? "is-selected" : ""
                      }`}
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

                        <small>Live ward prediction</small>

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
            <section className="heat-panel precautions-panel">
              <div className="insights-header">
                <div className="insights-label">HEAT SAFETY PRECAUTIONS</div>

                <small>
                  {displayedZone?.riskLevel
                    ? `${displayedZone.riskLevel.replace("_", " ")} RISK`
                    : "LIVE"}
                </small>
              </div>

              <div className="precautions-list">
                {displayedZone?.riskLevel === "VERY_HIGH" && (
                  <>
                    <div className="precaution-item">
                      <strong>Avoid unnecessary outdoor activity</strong>
                      <span>
                        Stay indoors or in a cool, shaded environment.
                      </span>
                    </div>

                    <div className="precaution-item">
                      <strong>Stay hydrated</strong>
                      <span>
                        Drink water frequently, even when you are not thirsty.
                      </span>
                    </div>

                    <div className="precaution-item">
                      <strong>Protect vulnerable people</strong>
                      <span>
                        Do not leave children, elderly people, or other
                        vulnerable persons unattended in the heat.
                      </span>
                    </div>

                    <div className="precaution-item">
                      <strong>Reschedule strenuous work</strong>
                      <span>
                        Avoid heavy physical activity during peak heat hours.
                      </span>
                    </div>

                    <div className="precaution-item">
                      <strong>Watch for heat illness</strong>
                      <span>
                        Seek medical help if severe dizziness, confusion,
                        fainting, or other serious symptoms occur.
                      </span>
                    </div>
                  </>
                )}

                {displayedZone?.riskLevel === "HIGH" && (
                  <>
                    <div className="precaution-item">
                      <strong>Stay hydrated</strong>
                      <span>Drink water regularly throughout the day.</span>
                    </div>

                    <div className="precaution-item">
                      <strong>Limit outdoor exposure</strong>
                      <span>
                        Avoid prolonged outdoor activity during peak heat.
                      </span>
                    </div>

                    <div className="precaution-item">
                      <strong>Take shade and rest breaks</strong>
                      <span>
                        Use shaded or cool areas frequently when outdoors.
                      </span>
                    </div>

                    <div className="precaution-item">
                      <strong>Check on vulnerable people</strong>
                      <span>
                        Pay extra attention to elderly people, children, and
                        outdoor workers.
                      </span>
                    </div>

                    <div className="precaution-item">
                      <strong>Wear light clothing</strong>
                      <span>
                        Prefer loose, lightweight clothing when outdoors.
                      </span>
                    </div>
                  </>
                )}

                {displayedZone?.riskLevel === "MODERATE" && (
                  <>
                    <div className="precaution-item">
                      <strong>Stay hydrated</strong>
                      <span>
                        Drink water regularly, especially when outdoors.
                      </span>
                    </div>

                    <div className="precaution-item">
                      <strong>Take breaks from the heat</strong>
                      <span>
                        Use shade or cool areas when you begin feeling
                        overheated.
                      </span>
                    </div>

                    <div className="precaution-item">
                      <strong>Monitor vulnerable people</strong>
                      <span>
                        Check on elderly people, children, and people working
                        outdoors.
                      </span>
                    </div>
                  </>
                )}

                {displayedZone?.riskLevel === "LOW" && (
                  <div className="precaution-item">
                    <strong>Normal heat precautions</strong>
                    <span>
                      Stay hydrated and remain aware of changing heat
                      conditions.
                    </span>
                  </div>
                )}
              </div>
            </section>

            <p className="data-disclaimer">
              {note} Live ward predictions are generated from ward-location
              weather data and the HeatGuard ML + HTSI pipeline. Map points
              represent ward centroids; official ward boundaries are not
              displayed.
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
