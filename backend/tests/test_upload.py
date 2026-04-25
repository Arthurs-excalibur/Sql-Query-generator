import requests
import os

BASE_URL = "http://localhost:3001/api"

def test_file_upload():
    print("Testing File Upload & Ingestion...")
    # Create a dummy CSV
    csv_content = "id,name,value\n1,test,100\n2,hello,200"
    with open("test_upload.csv", "w") as f:
        f.write(csv_content)
    
    try:
        with open("test_upload.csv", "rb") as f:
            files = {'file': ('test_upload.csv', f, 'text/csv')}
            resp = requests.post(f"{BASE_URL}/upload", files=files)
            
        if resp.status_code == 200:
            data = resp.json()
            table_name = data.get('table')
            print(f"  [PASS] Upload successful. Table: {table_name}")
            
            # Verify data exists
            check_resp = requests.post(f"{BASE_URL}/sql/execute", json={"sql": f"SELECT * FROM {table_name}"})
            if check_resp.status_code == 200:
                rows = check_resp.json().get('rows', [])
                print(f"  [PASS] Ingestion verified. Rows: {len(rows)}")
            else:
                print(f"  [FAIL] Query failed: {check_resp.text}")
        else:
            print(f"  [FAIL] Upload failed: {resp.status_code} {resp.text}")
    finally:
        if os.path.exists("test_upload.csv"):
            os.remove("test_upload.csv")

if __name__ == "__main__":
    test_file_upload()
