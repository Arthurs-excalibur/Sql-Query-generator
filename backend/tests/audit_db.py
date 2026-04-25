import duckdb
import os

db_path = 'data.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
else:
    try:
        conn = duckdb.connect(db_path, read_only=True)
        tables = conn.execute("SHOW TABLES").fetchall()
        print(f"Total tables: {len(tables)}")
        for t in tables:
            name = t[0]
            count = conn.execute(f'SELECT COUNT(*) FROM "{name}"').fetchone()[0]
            cols = conn.execute(f'PRAGMA table_info("{name}")').fetchall()
            col_list = [f"{c[1]} ({c[2]})" for c in cols]
            print(f"Table: {name}")
            print(f"  Rows: {count}")
            print(f"  Columns: {', '.join(col_list)}")
            print("-" * 30)
        conn.close()
    except Exception as e:
        print(f"Error checking DB: {e}")
