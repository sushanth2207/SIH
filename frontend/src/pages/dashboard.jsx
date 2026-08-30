import { useEffect, useState } from "react";
import { Badge, Button } from "react-bootstrap";
import { MapContainer, Polygon, Popup, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getDashboardData } from "../services/api";
import { demoHeatZones, riskZoneColors } from "../data/demoHeatZones";

const navigationItems = [["▦", "Overview"], ["⌑", "Heat Maps"], ["⚠", "Risk Zones"], ["◉", "Sensors"], ["▥", "Analytics"], ["☼", "Forecasts"], ["✱", "Response"], ["▤", "Reports"], ["◴", "History"], ["⚒", "Maintenance"]];
const levelClass = (level) => `risk-${level?.toLowerCase().replace("_", "-") || "moderate"}`;
const displayLevel = (level) => level?.replace("_", " ") || "MODERATE";
function RiskBadge({ level }) { return <Badge className={`risk-badge ${levelClass(level)}`}>{displayLevel(level)}</Badge>; }

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedZone, setSelectedZone] = useState(null);
  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      try { const dashboardData = await getDashboardData(); if (!cancelled) { setData(dashboardData); setError(""); } }
      catch { if (!cancelled) setError("Could not load dashboard data. Start the backend with npm start in the backend folder (http://localhost:5000), then refresh."); }
      finally { if (!cancelled) setLoading(false); }
    }
    loadDashboard();
    return () => { cancelled = true; };
  }, []);
  if (loading) return <div className="dashboard-state"><div className="loading-orb" /><p>Loading HeatGuard dashboard data…</p></div>;
  if (error) return <div className="dashboard-state"><h1>HEATGUARD</h1><p className="error-message">{error}</p></div>;

  const { wards, forecast, alerts, note } = data;
  const selectedWard = wards.find((ward) => ward.areaId === "ward_12") || wards[0];
  const displayedZone = selectedZone || { wardName: `${selectedWard.name} Demo Zone`, riskLevel: selectedWard.riskLevel, riskScore: selectedWard.riskScore, heatIndex: "44.7 °C", thermalStress: selectedWard.thermalStress, population: "45,231" };
  const priorityWards = [...wards].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
  const distribution = { VERY_HIGH: wards.filter((ward) => ward.riskLevel === "VERY_HIGH").length, HIGH: wards.filter((ward) => ward.riskLevel === "HIGH").length, MODERATE: wards.filter((ward) => ward.riskLevel === "MODERATE").length, LOW: wards.filter((ward) => ward.riskLevel === "LOW").length };
  return <div className="heatguard-shell">
    <aside className="heatguard-sidebar">
      <div className="brand"><span className="brand-flame">♨</span> HEATGUARD</div>
      <div className="operator-card"><span className="operator-avatar">◉</span><div><strong>OPERATOR–01</strong><small>Active Duty</small></div></div>
      <nav className="main-nav" aria-label="Dashboard navigation">{navigationItems.map(([icon, label], index) => <button className={index === 0 ? "nav-item active" : "nav-item"} key={label}><span>{icon}</span>{label}</button>)}</nav>
      <Button className="emergency-button" variant="outline-danger">ⓘ <span>Emergency Alert</span></Button><div className="sidebar-bottom"><button>ⓘ Support</button><button>⇥ Logout</button></div>
    </aside>
    <main className="heatguard-main">
      <section className="primary-dashboard-grid">
        <section className="map-panel heat-panel">
          <div className="heat-map-demo" aria-label="Synthetic demo heat risk map, not official ward boundaries"><MapContainer center={[17.385, 78.4867]} zoom={12} zoomControl={false} className="heatguard-leaflet-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><ZoomControl position="topright" />{demoHeatZones.map((zone) => { const isSelected = selectedZone?.id === zone.id; return <Polygon key={zone.id} positions={zone.coordinates} pathOptions={{ color: riskZoneColors[zone.riskLevel], fillColor: riskZoneColors[zone.riskLevel], fillOpacity: isSelected ? .7 : .48, weight: isSelected ? 4 : 2, opacity: 1 }} eventHandlers={{ click: () => setSelectedZone(zone) }}><Popup><strong>{zone.wardName}</strong><br /><small>Synthetic demo zone — not an official ward boundary</small><br />Risk level: {displayLevel(zone.riskLevel)}<br />Risk score: {zone.riskScore}<br />Heat index: {zone.heatIndex}<br />Thermal stress: {zone.thermalStress} / 100<br />Population: {zone.population}</Popup></Polygon>; })}</MapContainer>
            <div className="risk-legend"><strong>RISK LEVEL</strong><span><i className="dot very-high" />Very High</span><span><i className="dot high" />High</span><span><i className="dot moderate" />Moderate</span><span><i className="dot low" />Low</span></div>
            <div className="ward-overlay"><div className="ward-title"><div><small className="selected-zone-label">{selectedZone ? "SELECTED DEMO ZONE" : "DEFAULT DEMO ZONE"}</small><strong>{displayedZone.wardName}</strong></div><RiskBadge level={displayedZone.riskLevel} /></div><div><span>Heat Index <em>demo</em></span><b>{displayedZone.heatIndex}</b></div><div><span>Thermal Stress</span><b>{displayedZone.thermalStress} / 100</b></div><div><span>Population <em>demo</em></span><b>{displayedZone.population}</b></div><div><span>Risk Score</span><b className="risk-score">{displayedZone.riskScore} / 100</b></div></div><span className="map-demo-label">Synthetic/demo zones — not official Hyderabad ward boundaries</span>
          </div>
          <div className="map-timeline"><span>Ⅱ</span><span>14:00</span><div className="timeline-line"><i /></div><span>18:00</span><span>⌁</span></div><div className="map-alert-strip"><span>Active Alerts</span>{alerts.slice(0, 2).map((alert) => <span className={`mini-alert ${alert.severity === "CRITICAL" ? "critical" : ""}`} key={alert.id}>▲ {alert.title} <em>demo</em></span>)}<span className="system-status">System Status <i /></span></div>
        </section>
        <aside className="right-rail"><section className="heat-panel forecast-panel"><h2>3-Day Heat Risk Forecast <small>synthetic demo</small></h2>{forecast.map((item, index) => <div className={`forecast-card ${index === 1 ? "forecast-emphasis" : ""}`} key={item.day}><div><strong>{item.day}</strong><small>{item.date}</small></div><RiskBadge level={item.riskLevel} /><b>{item.temperatureRange}</b><span className="weather-icon">{item.icon}</span></div>)}</section><section className="heat-panel alerts-panel"><div className="section-title"><h2>Active Alerts <small>synthetic demo</small></h2><button>View All</button></div><div className="alerts-list">{alerts.map((alert) => <article className={`warning-card alert-${alert.severity.toLowerCase()}`} key={alert.id}><div className="alert-heading"><strong>▲ &nbsp; {alert.title}</strong><span className="alert-severity">{alert.severity}</span></div><span>Demo zones: {alert.affectedZones.join(", ")}</span><p>{alert.message}</p></article>)}</div></section></aside>
      </section>
      <section className="analytics-grid"><section className="heat-panel chart-panel"><h2>Heat Index Trend (Hyderabad) <small>demo</small></h2><div className="line-chart"><svg viewBox="0 0 420 180" role="img" aria-label="Demo heat index trend"><polyline points="0,133 78,122 151,145 232,72 310,91 410,48" fill="none" stroke="#ffa3a0" strokeWidth="4" /><g fill="#ffa3a0"><circle cx="78" cy="122" r="5" /><circle cx="151" cy="145" r="5" /><circle cx="232" cy="72" r="5" /><circle cx="310" cy="91" r="5" /><circle cx="410" cy="48" r="6" /></g></svg><span className="chart-value">41.2°C <em>demo</em></span><div className="chart-axis"><span>24 May</span><span>26 May</span><span>28 May</span><span>30 May</span></div></div></section><section className="heat-panel distribution-panel"><h2>Risk Level Distribution <small>demo</small></h2><div className="distribution-content"><div className="donut"><span>WARDS</span></div><div className="distribution-list">{Object.entries(distribution).map(([level, count]) => <span key={level}><i className={`dot ${levelClass(level).replace("risk-", "")}`} />{displayLevel(level)} <b>{count}</b></span>)}</div></div></section><section className="heat-panel priority-panel"><h2>Top Priority Areas <small>demo</small></h2>{priorityWards.map((ward, index) => <div className="priority-row" key={ward.areaId}><b>{index + 1}</b><div><strong>{ward.name} – Demo area</strong><small>Risk Score: {ward.riskScore}</small></div><RiskBadge level={ward.riskLevel} /></div>)}</section></section>
      <section className="heat-panel insights-panel"><div className="insights-label">▣ &nbsp; AI INSIGHTS <small>demo</small></div><div className="insight-item">▣ <span>Placeholder: issue heat-safety communication for outdoor workers in Ward 12 and Ward 13.</span></div><div className="insight-item">▣ <span>Placeholder: prepare cooling centres in high-risk areas with vulnerable populations.</span></div></section><p className="data-disclaimer">{note} Supplementary map, forecast, alert, trend, and insight text on this screen is clearly marked demo/placeholder content.</p>
    </main>
  </div>;
}
export default Dashboard;
