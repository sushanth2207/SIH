# SIH 2026 — Extreme Heatwave Early Warning System

## Project Goal

We are building a web-based **Extreme Heatwave Early Warning and Human Thermal Stress Index** platform for Smart India Hackathon 2026.

The system should go beyond displaying temperature. It should combine weather conditions, human thermal stress, area-level vulnerability, geographic information, and ML-based risk prediction to provide localized heat-risk intelligence, forecasts, alerts, and recommendations.

The project is an MVP for a 3-day internal hackathon. Do not over-engineer it or introduce unnecessary technologies.

---

## Core System Flow

Data Sources
→ Data Analysis & Feature Engineering
→ Thermal Stress Calculation
→ ML / Risk Model
→ ML API
→ Node/Express Backend
→ MongoDB
→ React Frontend
→ GIS Map / Dashboard / Forecast / Alerts

The final product should demonstrate:

**Observe → Analyze → Predict → Localize → Warn → Act**

---

## Current Project Structure

```text
SIH/
├── frontend/
├── backend/
├── ml-service/
├── data/
└── docs/
```

The frontend is a React + Vite application.

The backend will use Node.js + Express.

The ML service will use Python + FastAPI.

MongoDB will be used for application data.

GIS visualization will use GeoJSON with Leaflet/React-Leaflet.

Bootstrap will be used for frontend UI styling rather than Tailwind.

---

## Frontend

Location:

```text
frontend/
```

Technology:

- React
- Vite
- Bootstrap / React-Bootstrap
- Leaflet / React-Leaflet
- Recharts where useful

Current frontend structure:

```text
frontend/
└── src/
    ├── components/
    ├── pages/
    │   └── dashboard.jsx
    ├── services/
    ├── hooks/
    ├── utils/
    ├── assets/
    ├── App.jsx
    └── main.jsx
```

The dashboard page is currently:

```text
src/pages/dashboard.jsx
```

Important: the filename is lowercase `dashboard.jsx`.

The frontend is already running successfully with Vite on localhost.

---

## Backend

Location:

```text
backend/
```

Technology:

- Node.js
- Express
- CORS

The backend will eventually provide REST APIs to the React frontend and communicate with the ML service and MongoDB.

Do not create unnecessary controllers, services, models, or routes until they are actually needed.

---

## ML Service

Location:

```text
ml-service/
```

Technology:

- Python
- Pandas
- NumPy
- Scikit-learn
- FastAPI

Ritvik owns the data analysis and ML work.

His pipeline will be:

Raw Data
→ Data Cleaning
→ Exploratory Data Analysis
→ Feature Engineering
→ Thermal Stress Features
→ Model Training
→ Model Comparison
→ Model Evaluation
→ Best Model
→ Prediction Interface

The ML service should eventually expose a simple prediction interface/API that the backend can consume.

Do not assume a specific ML algorithm before the data and target variable have been finalized.

Do not add deep learning merely for the sake of using AI.

---

## Data

Location:

```text
data/
```

Expected categories:

```text
data/
├── weather/
├── vulnerability/
└── geojson/
```

Weather data may include variables such as:

- Temperature
- Humidity / dew point
- Wind speed
- Solar radiation
- Time
- Geographic location

ERA5-Land is being considered for historical weather data.

Do not download or invent datasets unless specifically instructed.

Synthetic/demo data must always be clearly labelled as synthetic/demo data.

---

## Risk Concept

The system should conceptually calculate:

Weather Conditions

- Thermal Stress
- Area Vulnerability
  →
  Heat Risk

Example final output:

```json
{
  "areaId": "ward_12",
  "riskScore": 89,
  "riskLevel": "VERY_HIGH",
  "thermalStress": 87
}
```

This is an example schema only. Do not assume these exact values or thresholds are scientifically validated.

---

## Dashboard Concept

The dashboard should eventually contain:

1. Overall heat-risk summary
2. High-risk zone count
3. Current thermal stress
4. Interactive GIS heat-risk map
5. Ward/area details
6. Forecast for upcoming days
7. Active heat alerts
8. Risk-based recommendations

A user should be able to select a ward/area and see relevant information such as:

- Temperature
- Humidity
- Wind
- Solar radiation
- Thermal stress
- Vulnerability
- Risk score
- Risk level
- Forecast
- Recommendation

---

## Development Philosophy

This is a hackathon MVP.

Prioritize:

- Working end-to-end functionality
- Clear architecture
- Understandable code
- Easy integration
- Good UI
- Demonstrable results

Avoid:

- Unnecessary abstractions
- Over-engineering
- Huge dependencies
- Complex authentication
- Microservices beyond what is needed
- Deep learning without justification
- Production-grade infrastructure that is unnecessary for the MVP

---

## AI Coding Rules

When modifying the project:

1. Inspect the existing code before changing it.
2. Respect the existing folder structure.
3. Do not rewrite unrelated files.
4. Do not introduce a new framework/library without explaining why it is necessary.
5. Keep changes small and testable.
6. Prefer simple, readable code.
7. Do not create duplicate components or duplicate functionality.
8. Do not change the architecture without asking first.
9. Do not replace React with another frontend framework.
10. Do not replace Bootstrap with Tailwind.
11. Do not create fake ML results and present them as real predictions.
12. Clearly distinguish mock/demo data from real data.

---

## Important Integration Principle

The ML service and web application are separate responsibilities.

Conceptually:

```text
Python ML
    ↓
FastAPI
    ↓
Node/Express
    ↓
MongoDB
    ↓
React
```

React should not directly contain ML logic.

The Node backend should not duplicate the ML model.

The Python service should be responsible for prediction.

---

## Current Status

Completed:

- GitHub repository created
- Local Git repository initialized
- Local project structure created
- Frontend initialized with React + Vite
- Frontend running successfully
- Basic dashboard page created
- Backend folder created
- Express and CORS installed
- Bootstrap selected as the frontend styling approach

Current immediate objective:

Build the application incrementally, beginning with the frontend/backend foundation and then integrating the ML service when Ritvik's model is ready.

---

## Working Style

Before implementing a significant feature:

1. Explain what is being built.
2. Explain which existing files will change.
3. Implement only that feature.
4. Run/test it.
5. Do not move to the next feature until the current one works.

Do not attempt to build the entire project in one operation.

The developer should remain in control of architecture and understand the generated code.
