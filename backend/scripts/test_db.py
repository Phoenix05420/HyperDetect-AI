from sqlalchemy import text
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import engine

def test_connection():
    print(f"Attempting to connect to Neon DB (Postgres)...")
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"[SUCCESS] Successfully connected to Neon DB!")
            print(f"Database Version: {version}")
    except Exception as e:
        print("[ERROR] Error connecting to Neon DB:")
        print(e)

if __name__ == "__main__":
    test_connection()
