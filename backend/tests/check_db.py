import duckdb
try:
    conn = duckdb.connect('data.db', read_only=True)
    tables = conn.execute("SHOW TABLES").fetchall()
    print(f"Tables: {tables}")
    for t in tables:
        info = conn.execute(f"PRAGMA table_info('{t[0]}')").fetchall()
        print(f"Schema for {t[0]}: {info}")
    conn.close()
    print("Database check successful.")
except Exception as e:
    print(f"Database check failed: {e}")
