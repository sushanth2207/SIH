import sys

import pandas as pd
import sklearn._loss.loss as sklearn_loss

sys.modules["_loss"] = sklearn_loss

from flask import Flask, request, jsonify

from predictor import get_forecast_predictions

from predictor import get_forecast_predictions, predict_from_weather


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


@app.post("/ward-predictions-batch")
def ward_predictions_batch():
    try:
        input_data = request.get_json()

        if not input_data:
            return jsonify({
                "error": "Request body is required"
            }), 400

        wards = input_data.get("wards")

        if wards is None:
            return jsonify({
                "error": "wards is required"
            }), 400

        results = []

        for ward in wards:
            historical_weather = ward.get(
                "historicalWeather"
            )

            current_weather = ward.get(
                "currentWeather"
            )

            if (
                historical_weather is None
                or current_weather is None
            ):
                continue

            historical_df = pd.DataFrame(
                historical_weather
            )

            current_df = pd.DataFrame(
                current_weather
            )

            required_columns = [
                "datetime",
                "temperature",
                "relative_humidity",
                "wet_bulb_temperature",
                "wind_speed",
                "solar_radiation_wm2"
            ]

            historical_df = historical_df[
                required_columns
            ].copy()

            current_df = current_df[
                required_columns
            ].copy()

            hourly, daily = get_forecast_predictions(
                historical_weather=historical_df,
                forecast_weather=current_df
            )

            latest = hourly.iloc[-1]

            results.append({
                "ward_id": ward["ward_id"],
                "temperature": round(
                    float(latest["temperature"]), 2
                ),
                "relativeHumidity": round(
                    float(
                        latest["relative_humidity"]
                    ), 2
                ),
                "wetBulbTemperature": round(
                    float(
                        latest[
                            "wet_bulb_temperature"
                        ]
                    ), 2
                ),
                "windSpeed": round(
                    float(latest["wind_speed"]), 2
                ),
                "solarRadiation": round(
                    float(
                        latest[
                            "solar_radiation_wm2"
                        ]
                    ), 2
                ),
                "heatIndex": round(
                    float(latest["heatIndex"]), 2
                ),
                "estimatedWBGT": round(
                    float(
                        latest["estimatedWBGT"]
                    ), 2
                ),
                "riskScore": round(
                    float(latest["riskScore"]), 2
                ),
                "HTSI": round(
                    float(latest["HTSI"]), 2
                ),
                "riskLevel": latest["riskLevel"]
            })

        return jsonify({
            "count": len(results),
            "predictions": results
        })

    except ValueError as error:
        return jsonify({
            "error": str(error)
        }), 400

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500

@app.post("/ward-prediction")
def ward_prediction():
    try:
        input_data = request.get_json()

        if not input_data:
            return jsonify({
                "error": "Request body is required"
            }), 400

        historical_weather = input_data.get("historicalWeather")
        current_weather = input_data.get("currentWeather")

        if historical_weather is None:
            return jsonify({
                "error": "historicalWeather is required"
            }), 400

        if current_weather is None:
            return jsonify({
                "error": "currentWeather is required"
            }), 400

        historical_df = pd.DataFrame(historical_weather)
        current_df = pd.DataFrame(current_weather)

        required_columns = [
            "datetime",
            "temperature",
            "relative_humidity",
            "wet_bulb_temperature",
            "wind_speed",
            "solar_radiation_wm2"
        ]

        historical_df = historical_df[required_columns].copy()
        current_df = current_df[required_columns].copy()

        combined = pd.concat(
            [
                historical_df,
                current_df
            ],
            ignore_index=True
        )

        predictions = get_forecast_predictions(
            historical_weather=historical_df,
            forecast_weather=current_df
        )

        hourly, daily = predictions

        latest = hourly.iloc[-1]

        return jsonify({
            "temperature": round(
                float(latest["temperature"]), 2
            ),
            "relativeHumidity": round(
                float(latest["relative_humidity"]), 2
            ),
            "wetBulbTemperature": round(
                float(latest["wet_bulb_temperature"]), 2
            ),
            "windSpeed": round(
                float(latest["wind_speed"]), 2
            ),
            "solarRadiation": round(
                float(latest["solar_radiation_wm2"]), 2
            ),
            "heatIndex": round(
                float(latest["heatIndex"]), 2
            ),
            "estimatedWBGT": round(
                float(latest["estimatedWBGT"]), 2
            ),
            "riskScore": round(
                float(latest["riskScore"]), 2
            ),
            "HTSI": round(
                float(latest["HTSI"]), 2
            ),
            "riskLevel": latest["riskLevel"]
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
