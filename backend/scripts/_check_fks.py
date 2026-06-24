"""检查数据库中所有外键关系"""
from utils.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    rows = conn.execute(text("""
        SELECT 
            tc.table_name, 
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name
    """)).fetchall()
    print(f"{'TABLE':<35} {'COLUMN':<25} -> {'FOREIGN TABLE':<35} {'FOREIGN COLUMN':<25}")
    print("-" * 120)
    for r in rows:
        print(f"{r.table_name:<35} {r.column_name:<25} -> {r.foreign_table_name:<35} {r.foreign_column_name:<25}")