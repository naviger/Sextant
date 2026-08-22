from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # API
    API_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Database
    DATABASE_URL: str = "http://localhost:8529"
    DATABASE_NAME: str = "sextant"
    ARANGODB_USER: str = "root"
    ARANGODB_PASSWORD: str = "arangodb123"
    
    # Keycloak/OIDC
    KEYCLOAK_URL: str = "http://localhost:8080"
    KEYCLOAK_REALM: str = "sextant"
    KEYCLOAK_CLIENT_ID: str = "sextant-api"
    KEYCLOAK_CLIENT_SECRET: str = ""
    
    # Security
    JWT_ALGORITHM: str = "RS256"
    JWT_EXPIRATION_HOURS: int = 24
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # CORS
    CORS_ORIGINS: str = '["http://localhost:3000"]'
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from JSON string."""
        try:
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:3000"]
    
    @property
    def keycloak_config_url(self) -> str:
        """Get Keycloak configuration URL for OIDC discovery."""
        return f"{self.KEYCLOAK_URL}/realms/{self.KEYCLOAK_REALM}/.well-known/openid-configuration"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.ENVIRONMENT == "production"


settings = Settings()
