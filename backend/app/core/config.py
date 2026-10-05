import email_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Validate email syntax only — no live DNS/MX lookups per request. A demo/offline backend
# shouldn't depend on network reachability to accept a well-formed address.
email_validator.CHECK_DELIVERABILITY = False


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    database_url: str = 'postgresql+psycopg2://ghoster:ghoster@localhost:5432/ghoster'
    secret_key: str = 'change-me-to-a-random-64-char-string'
    access_token_expire_minutes: int = 60
    cors_origins: str = 'http://localhost:5173'

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(',') if origin.strip()]


settings = Settings()
