"""
Ollama LLM Client for Sextant Application

This module provides a robust client for interacting with Ollama LLM service.
It handles connection pooling, retries, streaming responses, and error handling.
"""

import os
import asyncio
import aiohttp
import requests
from typing import Optional, AsyncGenerator, List, Dict, Any
from enum import Enum
from functools import lru_cache
from datetime import datetime

class OllamaModel(str, Enum):
    """Available Ollama models"""
    LLAMA2 = "llama2"
    MISTRAL = "mistral"
    NEURAL_CHAT = "neural-chat"
    ORCA_MINI = "orca-mini"
    ZEPHYR = "zephyr"
    OPENCHAT = "openchat"


class OllamaClient:
    """
    Synchronous Ollama client for blocking operations
    
    Example:
        client = OllamaClient()
        response = client.generate("What is AI?")
        print(response)
    """
    
    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: int = 300,
        retries: int = 3
    ):
        """
        Initialize Ollama client
        
        Args:
            base_url: Ollama API URL (default: from OLLAMA_BASE_URL env var)
            timeout: Request timeout in seconds
            retries: Number of retry attempts
        """
        self.base_url = base_url or os.getenv(
            "OLLAMA_BASE_URL",
            "http://localhost:11434"
        )
        self.timeout = timeout
        self.retries = retries
        self.session = requests.Session()
        
    def generate(
        self,
        prompt: str,
        model: str = "llama2",
        stream: bool = False,
        temperature: float = 0.7,
        top_p: float = 0.95,
        top_k: int = 40,
    ) -> str:
        """
        Generate text using Ollama
        
        Args:
            prompt: Text prompt for generation
            model: Model name (default: llama2)
            stream: Stream response (for streaming, see stream_generate)
            temperature: Creativity level (0.0-1.0)
            top_p: Nucleus sampling parameter
            top_k: Top-K sampling parameter
            
        Returns:
            Generated text response
            
        Raises:
            requests.RequestException: If request fails after retries
        """
        for attempt in range(self.retries):
            try:
                response = self.session.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": stream,
                        "options": {
                            "temperature": temperature,
                            "top_p": top_p,
                            "top_k": top_k,
                        }
                    },
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    return response.json().get("response", "")
                else:
                    raise requests.RequestException(
                        f"Ollama error: {response.status_code} - {response.text}"
                    )
                    
            except requests.RequestException as e:
                if attempt == self.retries - 1:
                    raise
                wait_time = 2 ** attempt  # Exponential backoff
                asyncio.run(asyncio.sleep(wait_time))
    
    def stream_generate(
        self,
        prompt: str,
        model: str = "llama2",
        temperature: float = 0.7,
        top_p: float = 0.95,
        top_k: int = 40,
    ) -> str:
        """
        Generate text with streaming response
        
        Args:
            prompt: Text prompt for generation
            model: Model name
            temperature: Creativity level
            top_p: Nucleus sampling parameter
            top_k: Top-K sampling parameter
            
        Yields:
            Text chunks as they arrive
        """
        response = self.session.post(
            f"{self.base_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": temperature,
                    "top_p": top_p,
                    "top_k": top_k,
                }
            },
            timeout=self.timeout,
            stream=True
        )
        
        if response.status_code != 200:
            raise requests.RequestException(
                f"Ollama error: {response.status_code}"
            )
        
        for line in response.iter_lines():
            if line:
                try:
                    import json
                    chunk = json.loads(line)
                    if chunk.get("response"):
                        yield chunk["response"]
                except Exception:
                    pass
    
    def list_models(self) -> List[Dict[str, Any]]:
        """
        List all available models
        
        Returns:
            List of model dictionaries with metadata
        """
        response = self.session.get(f"{self.base_url}/api/tags")
        
        if response.status_code == 200:
            return response.json().get("models", [])
        return []
    
    def model_info(self, model: str) -> Dict[str, Any]:
        """
        Get information about a specific model
        
        Args:
            model: Model name
            
        Returns:
            Model information
        """
        response = self.session.post(
            f"{self.base_url}/api/show",
            json={"name": model}
        )
        
        if response.status_code == 200:
            return response.json()
        return {}
    
    def pull_model(self, model: str) -> bool:
        """
        Pull a model from the registry
        
        Args:
            model: Model name to pull
            
        Returns:
            True if successful
        """
        response = self.session.post(
            f"{self.base_url}/api/pull",
            json={"name": model}
        )
        return response.status_code == 200
    
    def delete_model(self, model: str) -> bool:
        """
        Delete a model to free space
        
        Args:
            model: Model name to delete
            
        Returns:
            True if successful
        """
        response = self.session.delete(
            f"{self.base_url}/api/delete",
            json={"name": model}
        )
        return response.status_code == 204
    
    def health_check(self) -> bool:
        """
        Check if Ollama service is healthy
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/tags",
                timeout=5
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def close(self):
        """Close the session"""
        self.session.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class AsyncOllamaClient:
    """
    Asynchronous Ollama client for non-blocking operations
    
    Example:
        async with AsyncOllamaClient() as client:
            response = await client.generate("What is AI?")
            print(response)
    """
    
    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: int = 300,
        retries: int = 3
    ):
        """Initialize async Ollama client"""
        self.base_url = base_url or os.getenv(
            "OLLAMA_BASE_URL",
            "http://localhost:11434"
        )
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.retries = retries
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def generate(
        self,
        prompt: str,
        model: str = "llama2",
        stream: bool = False,
        temperature: float = 0.7,
        top_p: float = 0.95,
        top_k: int = 40,
    ) -> str:
        """
        Asynchronously generate text using Ollama
        
        Args:
            prompt: Text prompt for generation
            model: Model name
            stream: Stream response (for streaming, see stream_generate)
            temperature: Creativity level
            top_p: Nucleus sampling parameter
            top_k: Top-K sampling parameter
            
        Returns:
            Generated text response
        """
        if not self.session:
            raise RuntimeError("Client not initialized. Use 'async with' context manager.")
        
        for attempt in range(self.retries):
            try:
                async with self.session.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": stream,
                        "options": {
                            "temperature": temperature,
                            "top_p": top_p,
                            "top_k": top_k,
                        }
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", "")
                    else:
                        raise aiohttp.ClientError(
                            f"Ollama error: {response.status}"
                        )
                        
            except aiohttp.ClientError as e:
                if attempt == self.retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
    
    async def stream_generate(
        self,
        prompt: str,
        model: str = "llama2",
        temperature: float = 0.7,
        top_p: float = 0.95,
        top_k: int = 40,
    ) -> AsyncGenerator[str, None]:
        """
        Asynchronously generate text with streaming response
        
        Args:
            prompt: Text prompt for generation
            model: Model name
            temperature: Creativity level
            top_p: Nucleus sampling parameter
            top_k: Top-K sampling parameter
            
        Yields:
            Text chunks as they arrive
        """
        if not self.session:
            raise RuntimeError("Client not initialized. Use 'async with' context manager.")
        
        async with self.session.post(
            f"{self.base_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": temperature,
                    "top_p": top_p,
                    "top_k": top_k,
                }
            }
        ) as response:
            if response.status != 200:
                raise aiohttp.ClientError(
                    f"Ollama error: {response.status}"
                )
            
            import json
            async for line in response.content:
                if line:
                    try:
                        chunk = json.loads(line.decode())
                        if chunk.get("response"):
                            yield chunk["response"]
                    except Exception:
                        pass
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """Asynchronously list all available models"""
        if not self.session:
            raise RuntimeError("Client not initialized. Use 'async with' context manager.")
        
        async with self.session.get(f"{self.base_url}/api/tags") as response:
            if response.status == 200:
                data = await response.json()
                return data.get("models", [])
        return []
    
    async def health_check(self) -> bool:
        """Asynchronously check if Ollama service is healthy"""
        if not self.session:
            raise RuntimeError("Client not initialized. Use 'async with' context manager.")
        
        try:
            async with self.session.get(
                f"{self.base_url}/api/tags",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                return response.status == 200
        except Exception:
            return False


# Global client instance (lazy loaded)
_client: Optional[OllamaClient] = None

@lru_cache(maxsize=1)
def get_client() -> OllamaClient:
    """Get or create global Ollama client"""
    global _client
    if _client is None:
        _client = OllamaClient()
    return _client
