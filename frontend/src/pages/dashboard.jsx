import { useEffect, useState } from "react";
import { Badge, Button } from "react-bootstrap";
import { getDashboardData } from "../services/api";

const navigationItems = [["▦", "Overview"], ["⌑", "Heat Maps"], ["⚠", "Risk Zones"], ["◉", "Sensors"], ["▥", "Analytics"], ["☼", "Forecasts"], ["✱", "Response"], ["▤", "Reports"], ["◴", "History"], ["⚒", "Maintenance"]];
const forecastDetails = [{ date: "30 May", range: "41 – 43 °C", icon: "☀" }, { date: "31 May", range: "43 – 45 °C", icon: "♨" }, { date: "1 Jun", range: "42 – 44 °C", icon: "◒" }];
const levelClass = (level) => `risk-${level?.toLowerCase().replace("_", "-") || "moderate"}`;
const displayLevel = (level) => level?.replace("_", " ") || "MODERATE";
function RiskBadge({ level }) { return <Badge className={`risk-badge ${levelClass(level)}`}>{displayLevel(level)}</Badge>; }

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const { summary, wards, forecast, note } = data;
  const selectedWard = wards.find((ward) => ward.areaId === "ward_12") || wards[0];
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
          <div className="panel-heading"><div><h1>Heat Risk Map – Hyderabad</h1><p>DEMO VISUALIZATION <span>|</span> 24/7 MONITORING</p></div><div className="map-controls"><Button aria-label="Zoom in">+</Button><Button aria-label="Zoom out">−</Button></div></div>
          <div className="heat-map-demo" aria-label="Demo heat risk map, not live geographic data"><div className="map-grid" /><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-road road-three" /><span className="map-label label-one">RAIDURGAR</span><span className="map-label label-two">MALAKPET</span><span className="map-label label-three">OLD CITY</span><span className="heat-spot spot-one" /><span className="heat-spot spot-two" /><span className="heat-spot spot-three" /><span className="heat-spot spot-four" />
            <div className="risk-legend"><strong>RISK LEVEL</strong><span><i className="dot very-high" />Very High</span><span><i className="dot high" />High</span><span><i className="dot moderate" />Moderate</span><span><i className="dot low" />Low</span></div>
            <div className="ward-overlay"><div className="ward-title"><strong>{selectedWard.name} – Demo Area</strong><RiskBadge level={selectedWard.riskLevel} /></div><div><span>Heat Index <em>demo</em></span><b>44.7 °C</b></div><div><span>Thermal Stress</span><b>{selectedWard.thermalStress} / 100</b></div><div><span>Population <em>demo</em></span><b>45,231</b></div><div><span>Risk Score</span><b className="risk-score">{selectedWard.riskScore} / 100</b></div></div><span className="map-demo-label">Synthetic/demo map — not live GIS data</span><span className="fullscreen-mark">⛶</span>
          </div>
          <div className="map-timeline"><span>Ⅱ</span><span>14:00</span><div className="timeline-line"><i /></div><span>18:00</span><span>⌁</span></div><div className="map-alert-strip"><span>Active Alerts</span><span className="mini-alert critical">▲ Sector 7C: Critical Overheat <em>demo</em></span><span className="mini-alert">▲ Sector 3A: Elevated Temp <em>demo</em></span><span className="system-status">System Status <i /></span></div>
        </section>
        <aside className="right-rail"><section className="heat-panel forecast-panel"><h2>3-Day Heat Risk Forecast <small>demo</small></h2>{forecast.map((item, index) => <div className={`forecast-card ${index === 1 ? "forecast-emphasis" : ""}`} key={item.day}><div><strong>{item.day}</strong><small>{forecastDetails[index].date}</small></div><RiskBadge level={item.riskLevel} /><b>{forecastDetails[index].range}</b><span className="weather-icon">{forecastDetails[index].icon}</span></div>)}</section><section className="heat-panel alerts-panel"><div className="section-title"><h2>Active Alerts <small>demo</small></h2><button>View All</button></div><div className="warning-card"><strong>▲ &nbsp; Extreme Heat Warning</strong><span>Demo wards: 12, 13, 14</span><p>Placeholder alert: elevated heat-stress conditions are forecast. Avoid outdoor activities during peak hours.</p></div></section></aside>
      </section>
      <section className="analytics-grid"><section className="heat-panel chart-panel"><h2>Heat Index Trend (Hyderabad) <small>demo</small></h2><div className="line-chart"><svg viewBox="0 0 420 180" role="img" aria-label="Demo heat index trend"><polyline points="0,133 78,122 151,145 232,72 310,91 410,48" fill="none" stroke="#ffa3a0" strokeWidth="4" /><g fill="#ffa3a0"><circle cx="78" cy="122" r="5" /><circle cx="151" cy="145" r="5" /><circle cx="232" cy="72" r="5" /><circle cx="310" cy="91" r="5" /><circle cx="410" cy="48" r="6" /></g></svg><span className="chart-value">41.2°C <em>demo</em></span><div className="chart-axis"><span>24 May</span><span>26 May</span><span>28 May</span><span>30 May</span></div></div></section><section className="heat-panel distribution-panel"><h2>Risk Level Distribution <small>demo</small></h2><div className="distribution-content"><div className="donut"><span>WARDS</span></div><div className="distribution-list">{Object.entries(distribution).map(([level, count]) => <span key={level}><i className={`dot ${levelClass(level).replace("risk-", "")}`} />{displayLevel(level)} <b>{count}</b></span>)}</div></div></section><section className="heat-panel priority-panel"><h2>Top Priority Areas <small>demo</small></h2>{priorityWards.map((ward, index) => <div className="priority-row" key={ward.areaId}><b>{index + 1}</b><div><strong>{ward.name} – Demo area</strong><small>Risk Score: {ward.riskScore}</small></div><RiskBadge level={ward.riskLevel} /></div>)}</section></section>
      <section className="heat-panel insights-panel"><div className="insights-label">▣ &nbsp; AI INSIGHTS <small>demo</small></div><div className="insight-item">▣ <span>Placeholder: issue heat-safety communication for outdoor workers in Ward 12 and Ward 13.</span></div><div className="insight-item">▣ <span>Placeholder: prepare cooling centres in high-risk areas with vulnerable populations.</span></div></section><p className="data-disclaimer">{note} Supplementary map, forecast, alert, trend, and insight text on this screen is clearly marked demo/placeholder content.</p>
    </main>
  </div>;
}
export default Dashboard;
