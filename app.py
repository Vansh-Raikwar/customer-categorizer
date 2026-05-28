import os
import joblib
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Load the clustered dataset and compute statistics
DATA_PATH = os.path.join("data", "clustered_data.csv")
MODEL_PATH = os.path.join("model", "catboost_model.pkl")

try:
    df_data = pd.read_csv(DATA_PATH)
except Exception as e:
    print(f"Error loading clustered dataset: {e}")
    df_data = pd.DataFrame()

# Precompute cluster stats for comparison visualizations
cluster_stats = {}
feature_defaults = {}

if not df_data.empty:
    # Compute feature defaults (mean) for robust fallback
    feature_defaults = df_data.drop("cluster", axis=1).mean().to_dict()

    # Compute cluster stats
    grouped = df_data.groupby("cluster").mean()
    for cluster_id in grouped.index:
        cluster_stats[int(cluster_id)] = grouped.loc[cluster_id].to_dict()

# Load the CatBoost model
try:
    model = joblib.load(MODEL_PATH)
    print("CatBoost model loaded successfully.")
except Exception as e:
    print(f"Error loading CatBoost model: {e}")
    model = None

# Feature list matching the training set columns and order exactly
FEATURES = [
    "Age",
    "Education",
    "Marital Status",
    "Parental Status",
    "Children",
    "Income",
    "Total_Spending",
    "Days_as_Customer",
    "Recency",
    "Wines",
    "Fruits",
    "Meat",
    "Fish",
    "Sweets",
    "Gold",
    "Web",
    "Catalog",
    "Store",
    "Discount Purchases",
    "Total Promo",
    "NumWebVisitsMonth",
]

# Define custom marketing segments and recommendations based on K-means profiling
SEGMENT_PROFILES = {
    0: {
        "name": "Elite/High-Value Shopper",
        "description": "High-income individuals with significant purchasing power. They spend heavily across premium categories (particularly Wine and Meat) and prefer traditional/exclusive purchase channels like Catalog and in-store, with a very low dependence on discount deals.",
        "strategies": [
            "Promote premium membership plans and exclusive early-access collections.",
            "Send personalized, elegant printed Catalog mailings focusing on premium Wines and gourmet Meats.",
            "Offer bespoke concierge services or VIP in-store shopping appointments.",
        ],
    },
    1: {
        "name": "Budget Value Seeker",
        "description": "Lower-income families or individuals who are highly price-sensitive. They have low total spending, buy mostly essential products, show high responsiveness to sales/deals, and frequently visit the website checking for active promotions.",
        "strategies": [
            "Deliver regular email and app notifications featuring high-value discount coupons and bulk deals.",
            "Highlight budget-friendly bundles, clearance sales, and daily flash discounts.",
            "Focus promotions on basic essentials and sweet treats (comfort goods) that drive higher transaction counts.",
        ],
    },
    2: {
        "name": "Balanced Mid-Tier Family",
        "description": "Middle-income customer segment, typically family households. They maintain moderate spending across all categories and show a balanced, steady distribution between physical stores, catalog sales, and web purchases.",
        "strategies": [
            "Leverage loyalty rewards programs to incentivize frequent repeat purchases.",
            "Target with multi-buy promotions on balanced items (e.g. Sweets, Gold, Web deals).",
            "Send cross-channel marketing campaigns spanning web notifications and store vouchers.",
        ],
    },
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Prediction model is currently unavailable."}), 500

    try:
        data = request.get_json() or {}

        # Build the feature row with default fallbacks
        features_dict = {}
        for feat in FEATURES:
            val = data.get(feat)
            if val is None:
                # Use mean defaults if feature is missing
                features_dict[feat] = feature_defaults.get(feat, 0.0)
            else:
                features_dict[feat] = float(val)

        # Structure as a single-row DataFrame matching training layout
        input_df = pd.DataFrame([features_dict], columns=FEATURES)

        # Predict the cluster (segment)
        prediction = model.predict(input_df)

        # Extract the integer prediction safely
        if hasattr(prediction, "ndim") and prediction.ndim > 1:
            predicted_cluster = int(prediction[0][0])
        else:
            predicted_cluster = int(prediction[0])

        segment = SEGMENT_PROFILES.get(
            predicted_cluster,
            {
                "name": "Unknown Segment",
                "description": "No segment description available.",
                "strategies": [],
            },
        )

        return jsonify(
            {
                "predicted_cluster": predicted_cluster,
                "segment_name": segment["name"],
                "segment_description": segment["description"],
                "marketing_strategies": segment["strategies"],
                "input_values": features_dict,
            }
        )

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 400


@app.route("/api/stats", methods=["GET"])
def get_stats():
    return jsonify(cluster_stats)


@app.route("/api/database", methods=["GET"])
def get_database():
    if df_data.empty:
        return jsonify({"records": [], "total": 0})

    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
        cluster_filter = request.args.get("cluster")

        filtered_df = df_data.copy()
        if cluster_filter is not None and cluster_filter != "":
            filtered_df = filtered_df[filtered_df["cluster"] == int(cluster_filter)]

        total_records = len(filtered_df)

        # Slice for pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_df = filtered_df.iloc[start_idx:end_idx]

        # Convert numeric rows to dicts
        records = paginated_df.to_dict(orient="records")

        return jsonify(
            {
                "records": records,
                "total": total_records,
                "page": page,
                "per_page": per_page,
            }
        )
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve records: {str(e)}"}), 400


if __name__ == "__main__":
    # Bind to standard local port
    app.run(host="127.0.0.1", port=5000, debug=True)
