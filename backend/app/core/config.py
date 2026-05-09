from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "虚拟试穿 API"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://tryon:tryon123@localhost:5432/virtual_tryon"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Auth
    JWT_SECRET: str = "your-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7

    # AI - 语言模型（mimo-v2.5）
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://token-plan-cn.xiaomimimo.com/v1"
    OPENAI_MODEL: str = "mimo-v2.5"

    # AI - 生图模型（hfsyapi gpt-image-2pro）
    OPENAI_IMAGE_API_KEY: str = ""
    OPENAI_IMAGE_BASE_URL: str = "https://www.hfsyapi.cn/v1"
    OPENAI_IMAGE_MODEL: str = "gpt-image-2pro"

    # Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Admin
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
