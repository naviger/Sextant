"""Test configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Authorization headers with test token."""
    # In production, use real token from test Keycloak instance
    test_token = "test_token_placeholder"
    return {"Authorization": f"Bearer {test_token}"}
