import pytest
import json
from app import app, FEATURES


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_home_route(client):
    """Test that the home page loads successfully."""
    response = client.get("/")
    assert response.status_code == 200
    assert b"Customer Segmentation Hub" in response.data


def test_stats_api(client):
    """Test that the cluster stats statistics API functions correctly."""
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = json.loads(response.data)

    # Assert that all 3 K-Means clusters (0, 1, 2) are represented
    assert "0" in data
    assert "1" in data
    assert "2" in data

    # Assert statistical keys exist (e.g. Income, Wines)
    assert "Income" in data["0"]
    assert "Wines" in data["0"]


def test_predict_endpoint_high_value(client):
    """Test predictions for a premium spender profile (Cluster 0 / Elite Spender)."""
    high_value_profile = {
        "Age": 45,
        "Income": 75000.0,
        "Education": 2,
        "Marital Status": 1,
        "Parental Status": 0,
        "Children": 0,
        "Wines": 600,
        "Meat": 500,
        "Fruits": 50,
        "Fish": 80,
        "Sweets": 40,
        "Gold": 100,
        "Web": 5,
        "Catalog": 8,
        "Store": 10,
        "Discount Purchases": 1,
        "NumWebVisitsMonth": 2,
        "Recency": 20,
        "Days_as_Customer": 4800,
        "Total Promo": 1,
    }
    response = client.post(
        "/predict", data=json.dumps(high_value_profile), content_type="application/json"
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["predicted_cluster"] == 0
    assert data["segment_name"] == "Elite/High-Value Shopper"
    assert "VIP in-store" in "".join(data["marketing_strategies"])


def test_predict_endpoint_fallback(client):
    """Test that missing form parameters are handled robustly with default means."""
    incomplete_profile = {"Age": 35, "Income": 35000.0}
    response = client.post(
        "/predict", data=json.dumps(incomplete_profile), content_type="application/json"
    )
    assert response.status_code == 200
    data = json.loads(response.data)

    # Model should succeed and return one of the cluster IDs (0, 1, 2)
    assert data["predicted_cluster"] in [0, 1, 2]
    assert "predicted_cluster" in data
    assert "segment_name" in data


def test_database_api(client):
    """Test that the database explorer pagination and filtering function correctly."""
    response = client.get("/api/database?page=1&per_page=5")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "records" in data
    assert "total" in data
    assert len(data["records"]) <= 5
    assert data["page"] == 1
    assert data["per_page"] == 5

    # Test filtering by cluster
    response_filtered = client.get("/api/database?page=1&per_page=5&cluster=0")
    assert response_filtered.status_code == 200
    data_filtered = json.loads(response_filtered.data)
    for record in data_filtered["records"]:
        assert record["cluster"] == 0
