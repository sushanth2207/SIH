# Heatguard — Extreme Heatwave Early Warning & Human Thermal Stress Index

**Smart India Hackathon 2026 | Problem Statement ID: 26083 | Team Invictus**

Heatguard moves beyond temperature-only alerts by computing a Human Thermal
Stress Index (HTSI) a weighted combination of a machine learning risk
score, Heat Index, and estimated WBGT — to assess real heat risk at the
ward level, rather than relying on dry-bulb temperature alone.

## Architecture

Weather Data (Open-Meteo) → Node.js/Express → Python Flask (feature prep)
→ ML Model (HistGradientBoostingRegressor) → HTSI Engine → Risk Level
→ React Dashboard + Twilio SMS Alert (VERY_HIGH, 1hr cooldown)

## Tech Stack
- **Backend:** Node.js, Express.js
- **ML Service:** Python, Flask, Scikit-learn (HistGradientBoostingRegressor)
- **Frontend:** React
- **Alerts:** Twilio SMS API
- **Weather Data:** Open-Meteo API

## HTSI Formula
HTSI = 0.40 × ML Risk Score + 0.30 × Heat Index + 0.30 × Estimated_WBGT

(Prototype weighting — not yet clinically validated)

## Current Status
| Component | Status |
| Weather pipeline | ✅ Tested |
| ML risk model | ✅ Trained |
| HTSI engine | ✅ Working |
| React dashboard | ✅ Built |
| SMS alerts (Twilio) | ✅ Tested |
| Ward-level weather | ✅ Real (per-coordinate) |
| Vulnerability + Mortality Index | 🔜 Planned — Census demographic data + relative-risk model |
| Public health advisories | 🔜 Planned |
