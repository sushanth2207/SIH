function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Extreme Heat Intelligence</h1>
        <p>Extreme Heatwave Early Warning System</p>
      </header>

      <section className="summary-grid">
        <div className="risk-card">
          <h3>High-Risk Zones</h3>
          <strong>7</strong>
          <p>Zones requiring attention</p>
        </div>

        <div className="risk-card">
          <h3>Thermal Stress</h3>
          <strong>HIGH</strong>
          <p>Current overall condition</p>
        </div>

        <div className="risk-card">
          <h3>Active Alerts</h3>
          <strong>3</strong>
          <p>Warnings currently active</p>
        </div>
      </section>

      <main className="main-grid">
        <section className="panel">
          <h2>Risk Map</h2>
          <p>GIS heat-risk map will appear here.</p>
        </section>

        <section className="panel">
          <h2>Forecast</h2>
          <p>Today — HIGH</p>
          <p>Tomorrow — VERY HIGH</p>
          <p>Day +2 — HIGH</p>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
