"""Tests for health check endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHealthEndpoints:
    """Health check endpoint tests."""
    
    def test_health_check(self):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data
        assert "timestamp" in data
    
    def test_liveness_check(self):
        """Test liveness probe."""
        response = client.get("/health/live")
        assert response.status_code == 200
        assert response.json()["status"] == "alive"
    
    def test_readiness_check(self):
        """Test readiness probe."""
        response = client.get("/health/ready")
        assert response.status_code == 200
        assert response.json()["status"] == "ready"


class TestRootEndpoints:
    """Test root endpoint."""
    
    def test_root(self):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_version(self):
        """Test version endpoint."""
        response = client.get("/version")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert "environment" in data
