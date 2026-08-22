"""
Ollama LLM API Endpoints for Sextant

Example FastAPI endpoints demonstrating Ollama LLM integration.
These can be included in your main api/app/main.py or in a routes module.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncio
import logging

from app.services.ollama_client import AsyncOllamaClient, OllamaModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/llm", tags=["LLM"])


class GenerateRequest(BaseModel):
    """Request model for text generation"""
    prompt: str = Field(..., description="Text prompt for generation")
    model: str = Field("llama2", description="Model to use")
    temperature: float = Field(0.7, ge=0.0, le=1.0, description="Creativity level")
    top_p: float = Field(0.95, ge=0.0, le=1.0, description="Nucleus sampling")
    top_k: int = Field(40, ge=1, le=100, description="Top-K sampling")


class GenerateResponse(BaseModel):
    """Response model for text generation"""
    response: str = Field(..., description="Generated text")
    model: str = Field(..., description="Model used")
    prompt: str = Field(..., description="Original prompt")
    temperature: float
    duration_ms: Optional[int] = Field(None, description="Response time in milliseconds")


class ModelInfo(BaseModel):
    """Model information"""
    name: str
    modified_at: str
    size: int
    digest: str


class HealthResponse(BaseModel):
    """Health check response"""
    healthy: bool
    message: str


@router.post("/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    """
    Generate text using Ollama LLM
    
    This endpoint accepts a prompt and returns generated text.
    Uses the specified model or defaults to llama2.
    
    Example:
        POST /api/v1/llm/generate
        {
            "prompt": "Explain machine learning in simple terms",
            "model": "mistral",
            "temperature": 0.8
        }
    """
    import time
    start_time = time.time()
    
    try:
        async with AsyncOllamaClient() as client:
            response = await client.generate(
                prompt=request.prompt,
                model=request.model,
                temperature=request.temperature,
                top_p=request.top_p,
                top_k=request.top_k
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            return GenerateResponse(
                response=response,
                model=request.model,
                prompt=request.prompt,
                temperature=request.temperature,
                duration_ms=duration_ms
            )
    except Exception as e:
        logger.error(f"Error generating text: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate text: {str(e)}"
        )


@router.get("/models", response_model=List[ModelInfo])
async def list_models():
    """
    List all available models
    
    Returns a list of models available on the Ollama instance.
    
    Example response:
        [
            {
                "name": "llama2:latest",
                "modified_at": "2024-01-15T10:30:00Z",
                "size": 3826519040,
                "digest": "sha256:..."
            }
        ]
    """
    try:
        async with AsyncOllamaClient() as client:
            models = await client.list_models()
            return models
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch models"
        )


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check Ollama service health
    
    Returns the health status of the Ollama service.
    
    Example response:
        {
            "healthy": true,
            "message": "Ollama service is healthy"
        }
    """
    try:
        async with AsyncOllamaClient() as client:
            is_healthy = await client.health_check()
            
            return HealthResponse(
                healthy=is_healthy,
                message=(
                    "Ollama service is healthy"
                    if is_healthy
                    else "Ollama service is unavailable"
                )
            )
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return HealthResponse(
            healthy=False,
            message=f"Health check failed: {str(e)}"
        )


@router.post("/summarize")
async def summarize_text(
    text: str = Query(..., description="Text to summarize"),
    model: str = Query("mistral", description="Model to use"),
    max_length: int = Query(100, ge=50, le=500, description="Max summary length")
):
    """
    Summarize text using Ollama LLM
    
    Takes a longer text and returns a concise summary.
    
    Example:
        POST /api/v1/llm/summarize?text=<long_text>&model=mistral
    """
    if len(text) < 100:
        raise HTTPException(
            status_code=400,
            detail="Text must be at least 100 characters"
        )
    
    prompt = f"Summarize the following text in approximately {max_length} words:\n\n{text}"
    
    try:
        async with AsyncOllamaClient() as client:
            summary = await client.generate(
                prompt=prompt,
                model=model,
                temperature=0.5  # Lower temperature for summaries
            )
            return {"summary": summary, "model": model}
    except Exception as e:
        logger.error(f"Error summarizing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/qa")
async def question_answering(
    context: str = Query(..., description="Context/document"),
    question: str = Query(..., description="Question about the context"),
    model: str = Query("neural-chat", description="Model to use")
):
    """
    Answer questions about a given context
    
    Reads the provided context and answers questions about it.
    
    Example:
        POST /api/v1/llm/qa?context=<text>&question=<question>
    """
    prompt = f"""Context:
{context}

Question: {question}

Answer based only on the context provided."""
    
    try:
        async with AsyncOllamaClient() as client:
            answer = await client.generate(
                prompt=prompt,
                model=model,
                temperature=0.3  # Low temperature for factual answers
            )
            return {
                "question": question,
                "answer": answer,
                "model": model,
                "context_length": len(context)
            }
    except Exception as e:
        logger.error(f"Error in QA: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/classify")
async def classify_text(
    text: str = Query(..., description="Text to classify"),
    categories: List[str] = Query(..., description="Categories to classify into"),
    model: str = Query("mistral", description="Model to use")
):
    """
    Classify text into one of provided categories
    
    Example:
        POST /api/v1/llm/classify?text=<text>&categories=positive&categories=negative&categories=neutral
    """
    categories_str = ", ".join(categories)
    prompt = f"""Classify the following text into one of these categories: {categories_str}

Text: {text}

Classification:"""
    
    try:
        async with AsyncOllamaClient() as client:
            classification = await client.generate(
                prompt=prompt,
                model=model,
                temperature=0.3
            )
            return {
                "text": text,
                "classification": classification.strip(),
                "categories": categories,
                "model": model
            }
    except Exception as e:
        logger.error(f"Error classifying: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Add these routes to your main FastAPI app:
# 
# from fastapi import FastAPI
# from app.routes.llm import router as llm_router
# 
# app = FastAPI()
# app.include_router(llm_router)
