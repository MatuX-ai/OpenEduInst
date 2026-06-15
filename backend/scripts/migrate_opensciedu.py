"""Add missing opensciedu columns to organizations table (PostgreSQL)"""
from sqlalchemy import text, inspect
from utils.database import engine

def migrate():
    inspector = inspect(engine)
    existing = {col['name'] for col in inspector.get_columns('organizations')}
    print(f"Existing columns count: {len(existing)}")

    columns_to_add = [
        ("opensciedu_api_key", "VARCHAR(255)"),
        ("opensciedu_api_enabled", "BOOLEAN DEFAULT FALSE"),
        ("opensciedu_sync_enabled", "BOOLEAN DEFAULT TRUE"),
        ("opensciedu_sync_interval", "INTEGER DEFAULT 3600"),
        ("opensciedu_last_sync", "TIMESTAMP"),
        ("opensciedu_sync_status", "VARCHAR(50) DEFAULT 'idle'"),
        ("opensciedu_api_config", "JSON DEFAULT '{}'::json"),
    ]

    with engine.connect() as conn:
        for col_name, col_type in columns_to_add:
            if col_name not in existing:
                sql = f"ALTER TABLE organizations ADD COLUMN {col_name} {col_type}"
                conn.execute(text(sql))
                conn.commit()
                print(f"[OK] Added column: {col_name}")
            else:
                print(f"[SKIP] Already exists: {col_name}")

    print("Migration complete!")

if __name__ == "__main__":
    migrate()
