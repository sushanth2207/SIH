# ============================================================
# HeatGuard - Thermal Risk Prediction
# predictor.py
# ============================================================

import sys

import pandas as pd
import numpy as np
import sklearn._loss.loss as sklearn_loss

# Compatibility fix for the saved sklearn model
sys.modules["_loss"] = sklearn_loss

import joblib


# ============================================================
# 1. LOAD TRAINED MODEL
# ============================================================

MODEL_PATH = "ml/models/heat_risk_model.pkl"

package = joblib.load(MODEL_PATH)

model = package["model"]
MODEL_FEATURES = package["features"]


# ============================================================
# 2. FEATURE ENGINEERING
# ============================================================

def create_model_features(df):
    df = df.copy()

    df["datetime"] = pd.to_datetime(df["datetime"])

    df = (
        df
        .sort_values("datetime")
        .reset_index(drop=True)
    )

    df["temperature_rolling_max_3d"] = (
        df["temperature"]
        .rolling(window=72, min_periods=1)
        .max()
    )

    df["temperature_rolling_mean_7d"] = (
        df["temperature"]
        .rolling(window=168, min_periods=1)
        .mean()
    )

    df["wetbulb_rolling_max_3d"] = (
        df["wet_bulb_temperature"]
        .rolling(window=72, min_periods=1)
        .max()
    )

    return df


# ============================================================
# 3. RISK LEVEL HELPERS
# ============================================================

def score_to_risk(score):
    if score < 25:
        return "LOW"
    elif score < 50:
        return "MODERATE"
    elif score < 75:
        return "HIGH"
    else:
        return "VERY_HIGH"


def htsi_to_level(score):
    if score < 25:
        return "LOW"
    elif score < 50:
        return "MODERATE"
    elif score < 75:
        return "HIGH"
    else:
        return "VERY_HIGH"


# ============================================================
# 4. HEAT INDEX
# ============================================================

def calculate_heat_index(
    temperature_c,
    relative_humidity
):
    T = float(temperature_c)
    RH = float(relative_humidity)

    if RH < 0 or RH > 100:
        raise ValueError(
            "Relative humidity must be between 0 and 100."
        )

    T_f = (T * 9 / 5) + 32

    HI_f = 0.5 * (
        T_f
        + 61.0
        + ((T_f - 68.0) * 1.2)
        + (RH * 0.094)
    )

    if (HI_f + T_f) / 2 >= 80:

        HI_f = (
            -42.379
            + 2.04901523 * T_f
            + 10.14333127 * RH
            - 0.22475541 * T_f * RH
            - 0.00683783 * T_f**2
            - 0.05481717 * RH**2
            + 0.00122874 * T_f**2 * RH
            + 0.00085282 * T_f * RH**2
            - 0.00000199 * T_f**2 * RH**2
        )

        if RH < 13 and 80 <= T_f <= 112:

            adjustment = (
                ((13 - RH) / 4)
                * np.sqrt(
                    (17 - abs(T_f - 95)) / 17
                )
            )

            HI_f -= adjustment

        elif RH > 85 and 80 <= T_f <= 87:

            adjustment = (
                ((RH - 85) / 10)
                * ((87 - T_f) / 5)
            )

            HI_f += adjustment

    else:
        HI_f = T_f

    HI_c = (HI_f - 32) * 5 / 9

    return round(HI_c, 2)


# ============================================================
# 5. ESTIMATED OUTDOOR WBGT
# ============================================================

def calculate_wbgt(
    temperature_c,
    relative_humidity,
    solar_radiation_wm2,
    wind_speed
):
    T = float(temperature_c)
    RH = float(relative_humidity)
    R = float(solar_radiation_wm2)
    W = float(wind_speed)

    Tw = (
        T * np.arctan(
            0.151977 * np.sqrt(RH + 8.313659)
        )
        + np.arctan(T + RH)
        - np.arctan(RH - 1.676331)
        + 0.00391838
        * RH ** 1.5
        * np.arctan(0.023101 * RH)
        - 4.686035
    )

    Tg = T + (
        0.00025 * R
        - 0.15 * np.sqrt(max(W, 0))
    )

    wbgt = (
        0.7 * Tw
        + 0.2 * Tg
        + 0.1 * T
    )

    return round(float(wbgt), 2)


# ============================================================
# 6. HTSI
# ============================================================

def normalize_metric(value, low, high):
    return float(
        np.clip(
            (float(value) - low)
            / (high - low)
            * 100,
            0,
            100
        )
    )


def calculate_htsi(
    risk_score,
    heat_index,
    estimated_wbgt
):
    """
    Human Thermal Stress Index.

    40% ML risk
    30% Heat Index stress
    30% WBGT stress
    """

    hi_score = normalize_metric(
        heat_index,
        27.0,
        40.0
    )

    wbgt_score = normalize_metric(
        estimated_wbgt,
        18.0,
        35.0
    )

    htsi = (
        0.40 * float(risk_score)
        + 0.30 * hi_score
        + 0.30 * wbgt_score
    )

    return round(
        float(np.clip(htsi, 0, 100)),
        2
    )


# ============================================================
# 7. PREDICT FROM READY FEATURES
# ============================================================

def predict_risk(input_data):

    missing_features = [
        feature
        for feature in MODEL_FEATURES
        if feature not in input_data
    ]

    if missing_features:
        raise ValueError(
            f"Missing required features: {missing_features}"
        )

    X_input = pd.DataFrame(
        [
            [
                input_data[feature]
                for feature in MODEL_FEATURES
            ]
        ],
        columns=MODEL_FEATURES
    )

    if X_input.isnull().any().any():
        raise ValueError(
            "Input contains missing values."
        )

    score = float(
        model.predict(X_input)[0]
    )

    score = float(
        np.clip(score, 0, 100)
    )

    return {
        "riskScore": round(score, 2),
        "riskLevel": score_to_risk(score)
    }


# ============================================================
# 8. PREDICT FROM RAW WEATHER
# ============================================================

def predict_from_weather(df):

    df_features = create_model_features(df)

    if df_features[MODEL_FEATURES].isnull().any().any():
        raise ValueError(
            "Model features contain missing values."
        )

    scores = model.predict(
        df_features[MODEL_FEATURES]
    )

    scores = np.clip(
        scores,
        0,
        100
    )

    df_features["riskScore"] = np.round(
        scores,
        2
    )

    df_features["riskLevel"] = [
        score_to_risk(score)
        for score in scores
    ]

    df_features["heatIndex"] = [
        calculate_heat_index(
            temperature,
            humidity
        )
        for temperature, humidity in zip(
            df_features["temperature"],
            df_features["relative_humidity"]
        )
    ]

    df_features["estimatedWBGT"] = [
        calculate_wbgt(
            temperature,
            humidity,
            solar,
            wind
        )
        for temperature, humidity, solar, wind in zip(
            df_features["temperature"],
            df_features["relative_humidity"],
            df_features["solar_radiation_wm2"],
            df_features["wind_speed"]
        )
    ]

    df_features["HTSI"] = [
        calculate_htsi(
            risk_score,
            heat_index,
            wbgt
        )
        for risk_score, heat_index, wbgt in zip(
            df_features["riskScore"],
            df_features["heatIndex"],
            df_features["estimatedWBGT"]
        )
    ]

    df_features["HTSI_level"] = (
        df_features["HTSI"].apply(htsi_to_level)
    )

    # HTSI is now the final decision level
    df_features["riskLevel"] = (
        df_features["HTSI_level"]
    )

    return df_features


# ============================================================
# 9. FORECAST PREDICTIONS
# ============================================================

def get_forecast_predictions(
    historical_weather,
    forecast_weather
):

    required_columns = [
        "datetime",
        "temperature",
        "relative_humidity",
        "wet_bulb_temperature",
        "wind_speed",
        "solar_radiation_wm2"
    ]

    missing_history = [
        col
        for col in required_columns
        if col not in historical_weather.columns
    ]

    if missing_history:
        raise ValueError(
            f"Historical weather is missing columns: "
            f"{missing_history}"
        )

    missing_forecast = [
        col
        for col in required_columns
        if col not in forecast_weather.columns
    ]

    if missing_forecast:
        raise ValueError(
            f"Forecast weather is missing columns: "
            f"{missing_forecast}"
        )

    # Historical data
    history = historical_weather[
        required_columns
    ].copy()

    history["datetime"] = pd.to_datetime(
        history["datetime"]
    )

    history = (
        history
        .sort_values("datetime")
        .drop_duplicates("datetime")
    )

    latest_time = history["datetime"].max()

    history = history[
        history["datetime"]
        >= latest_time - pd.Timedelta(days=7)
    ].copy()

    # Forecast data
    forecast = forecast_weather[
        required_columns
    ].copy()

    forecast["datetime"] = pd.to_datetime(
        forecast["datetime"]
    )

    forecast = (
        forecast
        .sort_values("datetime")
        .drop_duplicates("datetime")
        .reset_index(drop=True)
    )

    # Combine
    combined = pd.concat(
        [
            history,
            forecast
        ],
        ignore_index=True
    )

    combined = (
        combined
        .drop_duplicates("datetime")
        .sort_values("datetime")
        .reset_index(drop=True)
    )

    # Rolling features
    combined["temperature_rolling_max_3d"] = (
        combined["temperature"]
        .rolling(window=72, min_periods=1)
        .max()
    )

    combined["temperature_rolling_mean_7d"] = (
        combined["temperature"]
        .rolling(window=168, min_periods=1)
        .mean()
    )

    combined["wetbulb_rolling_max_3d"] = (
        combined["wet_bulb_temperature"]
        .rolling(window=72, min_periods=1)
        .max()
    )

    # Forecast rows
    forecast_start = forecast["datetime"].min()

    future = combined[
        combined["datetime"] >= forecast_start
    ].copy()

    if future[MODEL_FEATURES].isnull().any().any():
        raise ValueError(
            "Forecast model features contain missing values."
        )

    # ML prediction
    scores = model.predict(
        future[MODEL_FEATURES]
    )

    scores = np.clip(
        scores,
        0,
        100
    )

    future["riskScore"] = np.round(
        scores,
        2
    )

    # Heat Index
    future["heatIndex"] = future.apply(
        lambda row: calculate_heat_index(
            row["temperature"],
            row["relative_humidity"]
        ),
        axis=1
    )

    # WBGT
    future["estimatedWBGT"] = future.apply(
        lambda row: calculate_wbgt(
            row["temperature"],
            row["relative_humidity"],
            row["solar_radiation_wm2"],
            row["wind_speed"]
        ),
        axis=1
    )

    # HTSI
    future["HTSI"] = [
        calculate_htsi(
            risk_score,
            heat_index,
            wbgt
        )
        for risk_score, heat_index, wbgt in zip(
            future["riskScore"],
            future["heatIndex"],
            future["estimatedWBGT"]
        )
    ]

    future["HTSI_level"] = (
        future["HTSI"].apply(htsi_to_level)
    )

    # FINAL DECISION = HTSI
    future["riskLevel"] = future["HTSI_level"]

    # ========================================================
    # DAILY SUMMARY
    # ========================================================

    future["date"] = future["datetime"].dt.date

    daily_rows = []

    for date, day_df in future.groupby("date"):

        max_temp_row = day_df.loc[
            day_df["temperature"].idxmax()
        ]

        max_hi_row = day_df.loc[
            day_df["heatIndex"].idxmax()
        ]

        max_wbgt_row = day_df.loc[
            day_df["estimatedWBGT"].idxmax()
        ]

        max_risk_row = day_df.loc[
            day_df["riskScore"].idxmax()
        ]

        max_htsi_row = day_df.loc[
            day_df["HTSI"].idxmax()
        ]

        daily_rows.append({

            "date": date,

            "max_temperature": float(
                max_temp_row["temperature"]
            ),

            "max_temperature_time": (
                max_temp_row["datetime"]
            ),

            "max_heatIndex": float(
                max_hi_row["heatIndex"]
            ),

            "max_heatIndex_time": (
                max_hi_row["datetime"]
            ),

            "max_estimatedWBGT": float(
                max_wbgt_row["estimatedWBGT"]
            ),

            "max_estimatedWBGT_time": (
                max_wbgt_row["datetime"]
            ),

            "max_riskScore": float(
                max_risk_row["riskScore"]
            ),

            "max_riskScore_time": (
                max_risk_row["datetime"]
            ),

            "max_HTSI": float(
                max_htsi_row["HTSI"]
            ),

            "max_HTSI_time": (
                max_htsi_row["datetime"]
            ),

            "avg_riskScore": float(
                day_df["riskScore"].mean()
            )
        })

    daily = pd.DataFrame(
        daily_rows
    )

    # FINAL DAILY DECISION = HTSI
    daily["HTSI_level"] = (
        daily["max_HTSI"].apply(htsi_to_level)
    )

    daily["riskLevel"] = (
        daily["HTSI_level"]
    )

    return future, daily


# ============================================================
# 10. DASHBOARD FORECAST OUTPUT
# ============================================================

def get_dashboard_forecast(
    historical_weather,
    forecast_weather
):

    hourly, daily = get_forecast_predictions(
        historical_weather=historical_weather,
        forecast_weather=forecast_weather
    )

    result = {}

    for position, (_, row) in enumerate(
        daily.iterrows()
    ):

        if position == 0:
            day_name = "today"
        elif position == 1:
            day_name = "tomorrow"
        elif position == 2:
            day_name = "day2"
        else:
            day_name = f"day{position}"

        result[day_name] = {

            "date": str(
                row["date"]
            ),

            "maxTemperature": round(
                float(row["max_temperature"]),
                2
            ),

            "maxTemperatureTime": (
                pd.Timestamp(
                    row["max_temperature_time"]
                ).strftime("%H:%M")
            ),

            "heatIndex": round(
                float(row["max_heatIndex"]),
                2
            ),

            "heatIndexTime": (
                pd.Timestamp(
                    row["max_heatIndex_time"]
                ).strftime("%H:%M")
            ),

            "estimatedWBGT": round(
                float(row["max_estimatedWBGT"]),
                2
            ),

            "estimatedWBGTTime": (
                pd.Timestamp(
                    row["max_estimatedWBGT_time"]
                ).strftime("%H:%M")
            ),

            # ML output retained
            "riskScore": round(
                float(row["max_riskScore"]),
                2
            ),

            "riskScoreTime": (
                pd.Timestamp(
                    row["max_riskScore_time"]
                ).strftime("%H:%M")
            ),

            # Final HTSI output
            "HTSI": round(
                float(row["max_HTSI"]),
                2
            ),

            "HTSITime": (
                pd.Timestamp(
                    row["max_HTSI_time"]
                ).strftime("%H:%M")
            ),

            "HTSILevel": row["HTSI_level"],

            "averageRiskScore": round(
                float(row["avg_riskScore"]),
                2
            ),

            # Final decision
            "riskLevel": row["riskLevel"]
        }

    return result


# ============================================================
# 11. SIMPLE MODEL TEST
# ============================================================

if __name__ == "__main__":

    sample_input = {
        "temperature": 15.2481,
        "relative_humidity": 95.1674,
        "wet_bulb_temperature": 14.6739,
        "wind_speed": 2.0184,
        "solar_radiation_wm2": 0.0,
        "temperature_rolling_max_3d": 28.4521,
        "temperature_rolling_mean_7d": 21.5962,
        "wetbulb_rolling_max_3d": 18.3197
    }

    result = predict_risk(sample_input)

    print(
        "Model:",
        package.get(
            "model_type",
            type(model).__name__
        )
    )

    print(
        "Features:",
        MODEL_FEATURES
    )

    print("\nPrediction:")
    print(result)
