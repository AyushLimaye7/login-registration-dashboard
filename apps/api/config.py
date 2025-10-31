from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings for the platform API."""

    # Database
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str

    # JWT Authentication    
    SECRET_KEY: str = "65_MD3uxUla-UAfD9HoBuoO7Rt67Nm_fmUG8LjpurQ0"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000"]

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = {
        "env_file": "../../.env.local",
        "extra": "ignore"
    }

# @lru_cache
def get_settings() -> Settings:
    """Get the settings."""
    return Settings() #pyrefly:ignore

settings = get_settings()