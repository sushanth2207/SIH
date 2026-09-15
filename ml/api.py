import sys

import pandas as pd
import sklearn._loss.loss as sklearn_loss

sys.modules["_loss"] = sklearn_loss

from flask import Flask, request, jsonify

from predictor import get_forecast_predictions


app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "heat-risk-ml"
    })


@app.post("/dashboard-forecast")
def dashboard_forecast():
    try:
        input_data = request.get_json()

        if not input_data:
            return jsonify({
                "error": "Request body is required"
            }), 400

        historical_weather = input_data.get("historicalWeather")
        forecast_weather = input_data.get("forecastWeather")

        if historical_weather is None:
            return jsonify({
                "error": "historicalWeather is required"
            }), 400

        if forecast_weather is None:
            return jsonify({
                "error": "forecastWeather is required"
            }), 400

        historical_df = pd.DataFrame(historical_weather)
        forecast_df = pd.DataFrame(forecast_weather)

        hourly, daily = get_forecast_predictions(
            historical_weather=historical_df,
            forecast_weather=forecast_df
        )

        daily_result = {}

        for position, (_, row) in enumerate(daily.iterrows()):
            if position == 0:
                day_name = "today"
            elif position == 1:
                day_name = "tomorrow"
            elif position == 2:
                day_name = "day2"
            else:
                day_name = f"day{position}"

            daily_result[day_name] = {
                "date": str(row["date"]),
                "maxTemperature": round(
                    float(row["max_temperature"]), 2
                ),
                "heatIndex": round(
                    float(row["max_heatIndex"]), 2
                ),
                "estimatedWBGT": round(
                    float(row["max_estimatedWBGT"]), 2
                ),
                "riskScore": round(
                    float(row["max_riskScore"]), 2
                ),
                "averageRiskScore": round(
                    float(row["avg_riskScore"]), 2
                ),
                "riskLevel": row["riskLevel"]
            }

        hourly_result = []

        for _, row in hourly.iterrows():
            hourly_result.append({
                "datetime": str(row["datetime"]),
                "temperature": round(
                    float(row["temperature"]), 2
                ),
                "heatIndex": round(
                    float(row["heatIndex"]), 2
                ),
                "estimatedWBGT": round(
                    float(row["estimatedWBGT"]), 2
                ),
                "riskScore": round(
                    float(row["riskScore"]), 2
                ),
                "riskLevel": row["riskLevel"]
            })

        return jsonify({
            "daily": daily_result,
            "hourly": hourly_result
        })

    except ValueError as error:
        return jsonify({
            "error": str(error)
        }), 400

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=8000,
        debug=False
    )
