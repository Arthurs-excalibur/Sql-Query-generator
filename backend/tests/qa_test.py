import requests
import json

BASE_URL = "http://localhost:3001/api"

def test_security_ast_block():
    print("Testing AST Security Block...")
    dangerous_queries = [
        "SELECT * FROM read_csv_auto('C:/Windows/win.ini')",
        "SELECT * FROM load_extension('some_ext')",
        "DROP TABLE users",
        "INSERT INTO users VALUES (1, 'hacker')",
        "SELECT * FROM users; ATTACH DATABASE 'evil.db' AS evil;"
    ]
    
    for sql in dangerous_queries:
        print(f"  SQL: {sql}")
        try:
            resp = requests.post(f"{BASE_URL}/sql/execute", json={"sql": sql})
            if resp.status_code == 403:
                print(f"  [PASS] Blocked correctly: {resp.json().get('detail')}")
            else:
                print(f"  [FAIL] FAILED: Status {resp.status_code}, Body: {resp.text}")
        except Exception as e:
            print(f"  [ERROR] ERROR: {e}")

def test_health():
    print("\nTesting Health Endpoint...")
    try:
        resp = requests.get(f"{BASE_URL}/health")
        if resp.status_code == 200:
            print(f"  [PASS] Success: {resp.json()}")
        else:
            print(f"  [FAIL] FAILED: {resp.status_code}")
    except Exception as e:
        print(f"  [ERROR] ERROR: {e}")

def test_schema():
    print("\nTesting Schema Enrichment...")
    try:
        resp = requests.get(f"{BASE_URL}/schema")
        if resp.status_code == 200:
            data = resp.json()
            tables = data.get('tables', [])
            print(f"  [PASS] Found {len(tables)} tables")
            if tables:
                t = tables[0]
                print(f"  [PASS] Table {t.get('name')} metadata: rowCount={t.get('rowCount')}, columns={len(t.get('columns', []))}")
                if 'preview' in t:
                    print(f"  [PASS] Preview data exists")
        else:
            print(f"  [FAIL] FAILED: {resp.status_code}")
    except Exception as e:
        print(f"  [ERROR] ERROR: {e}")

if __name__ == "__main__":
    test_health()
    test_security_ast_block()
    test_schema()
