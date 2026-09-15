const API_BASE_URL = "http://localhost:5000";

export async function getDashboardData() {
  const response = await fetch(`${API_BASE_URL}/api/dashboard`);

  if (!response.ok) {
    throw new Error(`Dashboard request failed (${response.status})`);
  }

  return response.json();
}

export async function getLiveWardPredictions() {
  const response = await fetch(`${API_BASE_URL}/api/wards/live-predictions`);

  if (!response.ok) {
    throw new Error(`Ward prediction request failed (${response.status})`);
  }

  return response.json();
}
