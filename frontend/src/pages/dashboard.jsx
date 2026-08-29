import { useEffect, useState } from "react";
import { getDashboardData } from "../services/api";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading dashboard data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Extreme Heat Intelligence</h1>
        </header>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  const { summary, wards, forecast, note } = data;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Extreme Heat Intelligence</h1>
        <p>Extreme Heatwave Early Warning System</p>
        {note ? <p className="data-note">{note}</p> : null}
      </header>

      <section className="summary-grid">
        <div className="risk-card">
          <h3>High-Risk Zones</h3>
          <strong>{summary.highRiskZoneCount}</strong>
          <p>Zones requiring attention</p>
        </div>

        <div className="risk-card">
          <h3>Thermal Stress</h3>
          <strong>{summary.thermalStress}</strong>
          <p>Current overall condition</p>
        </div>

        <div className="risk-card">
          <h3>Active Alerts</h3>
          <strong>{summary.activeAlertCount}</strong>
          <p>Warnings currently active</p>
        </div>
      </section>

      <main className="main-grid">
        <section className="panel">
          <h2>Wards</h2>
          <table className="ward-table">
            <thead>
              <tr>
                <th>Ward</th>
                <th>Risk level</th>
                <th>Risk score</th>
                <th>Thermal stress</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((ward) => (
                <tr key={ward.areaId}>
                  <td>{ward.name}</td>
                  <td>{ward.riskLevel}</td>
                  <td>{ward.riskScore}</td>
                  <td>{ward.thermalStress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Forecast</h2>
          {forecast.map((item) => (
            <p key={item.day}>
              {item.day} — {item.riskLevel}
            </p>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
