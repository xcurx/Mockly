from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    nvidia_api_key: str = ""
    nvidia_base_url: str = ""
    nvidia_fast_model: str = ""
    nvidia_smart_model: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]
    tavily_api_key: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()


