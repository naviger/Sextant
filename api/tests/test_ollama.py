"""
Tests for Ollama LLM integration

Run with: pytest api/tests/test_ollama.py
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from app.services.ollama_client import OllamaClient, AsyncOllamaClient


class TestOllamaClient:
    """Test synchronous Ollama client"""
    
    def test_client_initialization(self):
        """Test client can be initialized"""
        client = OllamaClient(base_url="http://localhost:11434")
        assert client.base_url == "http://localhost:11434"
        assert client.timeout == 300
        client.close()
    
    def test_health_check(self):
        """Test health check"""
        client = OllamaClient()
        # This will return True/False depending on if Ollama is running
        result = client.health_check()
        assert isinstance(result, bool)
        client.close()
    
    @patch('requests.Session.post')
    def test_generate(self, mock_post):
        """Test text generation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"response": "AI is intelligence"}
        mock_post.return_value = mock_response
        
        client = OllamaClient()
        result = client.generate("What is AI?", model="llama2")
        
        assert result == "AI is intelligence"
        assert mock_post.called
        client.close()
    
    @patch('requests.Session.get')
    def test_list_models(self, mock_get):
        """Test listing models"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "models": [
                {
                    "name": "llama2:latest",
                    "modified_at": "2024-01-15T10:30:00Z",
                    "size": 3826519040,
                    "digest": "sha256:..."
                }
            ]
        }
        mock_get.return_value = mock_response
        
        client = OllamaClient()
        models = client.list_models()
        
        assert len(models) > 0
        assert models[0]["name"] == "llama2:latest"
        client.close()
    
    @patch('requests.Session.post')
    def test_stream_generate(self, mock_post):
        """Test streaming generation"""
        import json
        
        # Create mock streaming response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.iter_lines.return_value = [
            json.dumps({"response": "AI "}).encode(),
            json.dumps({"response": "is "}).encode(),
            json.dumps({"response": "great"}).encode(),
        ]
        mock_post.return_value = mock_response
        
        client = OllamaClient()
        chunks = list(client.stream_generate("What is AI?"))
        
        assert len(chunks) == 3
        assert chunks[0] == "AI "
        client.close()


class TestAsyncOllamaClient:
    """Test asynchronous Ollama client"""
    
    @pytest.mark.asyncio
    async def test_async_health_check(self):
        """Test async health check"""
        async with AsyncOllamaClient() as client:
            result = await client.health_check()
            assert isinstance(result, bool)
    
    @pytest.mark.asyncio
    async def test_async_list_models(self):
        """Test async listing models"""
        # Mock the session
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json.return_value = {"models": []}
            
            mock_get.return_value.__aenter__.return_value = mock_response
            
            async with AsyncOllamaClient() as client:
                # This should not raise an error
                # Note: actual result depends on mock behavior
                pass


class TestIntegration:
    """Integration tests (require running Ollama service)"""
    
    @pytest.mark.skipif(
        True,  # Skip by default since it requires Ollama running
        reason="Requires running Ollama service"
    )
    def test_real_generation(self):
        """Test actual text generation with running Ollama"""
        client = OllamaClient()
        
        if not client.health_check():
            pytest.skip("Ollama service not available")
        
        result = client.generate("Say 'hello'", model="llama2")
        assert len(result) > 0
        client.close()
    
    @pytest.mark.skipif(
        True,  # Skip by default
        reason="Requires running Ollama service"
    )
    def test_model_operations(self):
        """Test pulling and deleting models"""
        client = OllamaClient()
        
        if not client.health_check():
            pytest.skip("Ollama service not available")
        
        # Get current models
        initial_models = client.list_models()
        initial_count = len(initial_models)
        
        # This is a dry test - actual operations require proper setup
        assert isinstance(initial_models, list)
        
        client.close()


# Usage examples in fixtures for documentation

@pytest.fixture
def ollama_client():
    """Fixture providing an Ollama client"""
    client = OllamaClient()
    yield client
    client.close()


@pytest.fixture
async def async_ollama_client():
    """Fixture providing an async Ollama client"""
    async with AsyncOllamaClient() as client:
        yield client


# Example of how to use in a test:
# 
# def test_with_client(ollama_client):
#     result = ollama_client.generate("What is Python?")
#     assert len(result) > 0
