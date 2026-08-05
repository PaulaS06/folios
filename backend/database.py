from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

URL_BASE_DATOS = "postgresql://postgres:paulaysimon2024@db.lghzjgpuakkmpntquvmv.supabase.co:5432/postgres"

engine = create_engine(URL_BASE_DATOS, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()