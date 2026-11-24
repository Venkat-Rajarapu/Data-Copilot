from sqlalchemy import create_engine

from database.config.database_config import DATABASE_URL


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
)