import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

# Use a random string to avoid unique constraint violations in DB tests
TEST_EMAIL = f"testuser_{uuid.uuid4().hex[:6]}@example.com"
TEST_PASSWORD = "strongpassword123"

def test_register_user():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Test User"
        }
    )
    # 201 Created or 200 OK depending on implementation
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["email"] == TEST_EMAIL
    assert "id" in data

def test_login_user():
    response = client.post(
        "/api/v1/auth/token",
        data={
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password():
    response = client.post(
        "/api/v1/auth/token",
        data={
            "username": TEST_EMAIL,
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
