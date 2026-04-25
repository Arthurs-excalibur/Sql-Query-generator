import uuid
import threading
import httpx
import shutil
import re
import os
import json
import duckdb
import sqlglot
from sqlglot import exp
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import date, datetime
import decimal
import math
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

def sanitize_data(data: Any) -> Any:
    """Recursively convert non-serializable objects to serializable ones."""
    try:
        if data is None:
            return None
        if isinstance(data, float):
            if math.isinf(data) or math.isnan(data):
                return str(data)
            return data
        if isinstance(data, (str, int, bool)):
            return data
        if isinstance(data, dict):
            return {str(k): sanitize_data(v) for k, v in data.items()}
        if isinstance(data, (list, tuple, set)):
            return [sanitize_data(i) for i in data]
        if isinstance(data, (date, datetime)):
            return data.isoformat()
        if isinstance(data, decimal.Decimal):
            f = float(data)
            if math.isinf(f) or math.isnan(f):
                return None
            return f
        if isinstance(data, uuid.UUID):
            return str(data)
        if isinstance(data, bytes):
            return data.decode('utf-8', errors='replace')
        if hasattr(data, '__dict__'):
            return sanitize_data(data.__dict__)
        return str(data)
    except Exception as e:
        print(f"Serialization error: {e}")
        return str(data)

async def warmup_llm():
    try:
        print("Warming up LLM...")
        async with httpx.AsyncClient(timeout=60) as client:
            await client.post(f"{OLLAMA_BASE_URL}/api/generate", json={
                "model": "qwen2.5-coder:3b",
                "prompt": "SELECT 1;",
                "stream": False,
                "temperature": 0.1
            })
        print("LLM warmup complete.")
    except Exception as e:
        print(f"LLM warmup failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run warmup without blocking startup
    import asyncio
    asyncio.create_task(warmup_llm())
    yield

app = FastAPI(title="SQL Query Generator Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_ROWS = 10000
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

async def _call_llm(prompt: str, model: str, temperature: float = 0.1) -> str:
    """Unified LLM caller with OpenRouter support and fallback logic."""
    
    # Check if this is an OpenRouter model
    is_openrouter = "/" in model or model == "openrouter/free"
    
    # Define fallbacks for free models if the primary fails
    fallbacks = [
        "nvidia/llama-3.1-nemotron-70b-instruct:free",
        "google/gemma-2-9b-it:free",
        "qwen/qwen-2-7b-instruct:free",
        "openrouter/free"
    ]
    
    models_to_try = [model] if not is_openrouter else ([model] + [m for m in fallbacks if m != model])

    for current_model in models_to_try:
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                if "/" in current_model or current_model == "openrouter/free":
                    # OpenRouter API call
                    response = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                            "HTTP-Referer": "http://localhost:5173", # Optional for OpenRouter
                            "X-Title": "SQL Query Generator",
                        },
                        json={
                            "model": current_model,
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": temperature
                        }
                    )
                    if response.status_code == 200:
                        return response.json()["choices"][0]["message"]["content"].strip()
                else:
                    # Local Ollama call
                    response = await client.post(
                        f"{OLLAMA_BASE_URL}/api/generate",
                        json={
                            "model": current_model,
                            "prompt": prompt,
                            "stream": False,
                            "temperature": temperature
                        }
                    )
                    if response.status_code == 200:
                        return response.json().get("response", "").strip()
        except Exception as e:
            print(f"LLM Error with model {current_model}: {e}")
            if not is_openrouter: # Don't fallback for local models unless specified
                break
            continue
            
    return ""

async def _stream_llm(prompt: str, model: str, temperature: float = 0.1):
    """Unified LLM streaming generator."""
    is_openrouter = "/" in model or model == "openrouter/free"
    
    if is_openrouter:
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "SQL Query Generator",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                    "stream": True
                }
            ) as response:
                if response.status_code != 200:
                    yield ""
                    return
                async for chunk in response.aiter_lines():
                    if chunk.startswith("data: "):
                        data_str = chunk[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
                        except:
                            pass
    else:
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": True,
                    "temperature": temperature
                }
            ) as response:
                if response.status_code != 200:
                    err_msg = f"LLM Error: Status {response.status_code}"
                    if response.status_code == 404:
                        err_msg = f"Model '{model}' not found. Run 'ollama pull {model}'"
                    yield f"⚠️ {err_msg}"
                    return
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if "response" in data:
                                yield data["response"]
                        except:
                            pass

# Database Connection Manager
active_connections = {}
conn_lock = threading.Lock()

def get_db_conn(session_id: str):
    if not session_id or not re.match(r'^[a-zA-Z0-9-]+$', session_id):
        session_id = 'default'
        
    os.makedirs("data", exist_ok=True)
    db_path = f"data/data_{session_id}.db"
    
    with conn_lock:
        if session_id not in active_connections:
            conn = duckdb.connect(db_path)
            conn.execute("INSTALL vss; LOAD vss;")
            
            # Setup dummy schema if not exists
            conn.execute('''
            CREATE TABLE IF NOT EXISTS schema_embeddings (
                table_name VARCHAR,
                embedding FLOAT[2048]
            );
            ''')
            
            # Insert dummy data if empty
            if conn.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'orders'").fetchone()[0] == 0:
                conn.execute('''
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER,
                    date DATE,
                    customer_id INTEGER,
                    amount DECIMAL
                );
                ''')
                conn.execute("INSERT INTO orders VALUES (1, '2023-01-15', 101, 150.50), (2, '2023-02-20', 102, 200.00), (3, '2023-03-05', 101, 350.75)")

            if conn.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users'").fetchone()[0] == 0:
                conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER,
                    name VARCHAR,
                    signup_date DATE
                );
                ''')
                conn.execute("INSERT INTO users VALUES (101, 'Alice', '2022-11-01'), (102, 'Bob', '2022-12-15')")

            active_connections[session_id] = conn
        return active_connections[session_id]

def get_session_conn(request: Request):
    session_id = request.headers.get('X-Session-ID', 'default')
    return get_db_conn(session_id)


class QueryRequest(BaseModel):
    query: str
    model: str = "qwen2.5-coder:3b"

class GenerateResponse(BaseModel):
    sql: str

class ExecuteResponse(BaseModel):
    rows: List[dict]
    columns: List[str]

class RunResponse(BaseModel):
    sql: str
    result: List[dict]
    columns: List[str]
    explanation: str
    validation: dict


def get_embedding(text: str) -> list:
    try:
        import urllib.request
        data = json.dumps({'model': 'qwen2.5-coder:3b', 'prompt': text}).encode('utf-8')
        req = urllib.request.Request(f'{OLLAMA_BASE_URL}/api/embeddings', data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode())
            emb = result.get('embedding', [0.0]*2048)
            if len(emb) < 2048:
                emb.extend([0.0] * (2048 - len(emb)))
            elif len(emb) > 2048:
                emb = emb[:2048]
            return emb
    except Exception as e:
        print("Embedding error:", e)
        return [0.0] * 2048

def get_schema(conn, query: str = None) -> dict:
    # Use cursor to avoid blocking writer locks
    c = conn.cursor()
    c = conn.cursor()
    try:
        tables_result = c.execute("SHOW TABLES;").fetchall()
        tables = [row[0] for row in tables_result]
    except Exception as e:
        print(f"Error fetching table list: {e}")
        return {"tables": [], "error": str(e)}

    schema_info = {"tables": []}
    for t in tables:
        try:
            # Get columns and types
            cols_result = c.execute(f'PRAGMA table_info("{t}")').fetchall()
            columns = [{"name": row[1], "type": str(row[2])} for row in cols_result]
            
            # Get row count
            try:
                row_count_res = c.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()
                row_count = row_count_res[0] if row_count_res else 0
            except:
                row_count = 0
            
            # Get preview rows
            preview = []
            try:
                preview_result = c.execute(f'SELECT * FROM "{t}" LIMIT 3').fetchall()
                col_names = [c["name"] for c in columns]
                for row in preview_result:
                    sanitized_row = sanitize_data(dict(zip(col_names, row)))
                    preview.append(sanitized_row)
            except Exception as e:
                print(f"Preview error for table {t}: {e}")
                
            schema_info["tables"].append({
                "name": t, 
                "columns": columns,
                "rowCount": row_count,
                "preview": preview
            })
        except Exception as e:
            print(f"Error processing schema for table {t}: {e}")
            schema_info["tables"].append({
                "name": t,
                "error": f"Failed to load schema: {str(e)}"
            })
            
    # RAG: Vectorized Schema Injection via DuckDB VSS Embeddings
    if query and len(schema_info["tables"]) > 3:
        query_emb = get_embedding(query)
        
        # Ensure all tables have embeddings
        try:
            existing_tables = set(row[0] for row in c.execute("SELECT table_name FROM schema_embeddings").fetchall())
            for table in schema_info["tables"]:
                t_name = table["name"]
                if t_name not in existing_tables:
                    col_names = ", ".join([col["name"] for col in table.get("columns", [])])
                    t_desc = f"Table {t_name} with columns {col_names}"
                    emb = get_embedding(t_desc)
                    c.execute("INSERT INTO schema_embeddings VALUES (?, ?)", [t_name, emb])
            
            # Find top 3 using array_distance
            res = c.execute("""
                SELECT table_name, array_distance(embedding, ?::FLOAT[2048]) as dist 
                FROM schema_embeddings 
                ORDER BY dist ASC 
                LIMIT 3
            """, [query_emb]).fetchall()
            
            top_tables = set([r[0] for r in res])
            schema_info["tables"] = [t for t in schema_info["tables"] if t["name"] in top_tables]
        except Exception as e:
            print(f"RAG Error: {e}")

    return schema_info

async def generate_sql(query: str, schema: dict, model: str) -> str:
    # Task 2.7: Enriched prompt for DuckDB
    prompt = f"""You are an expert SQL generator for DuckDB.

Rules:
- Only use tables and columns from the provided schema
- Never hallucinate tables or columns
- Use DuckDB SQL syntax (not PostgreSQL)
- Use efficient queries with appropriate LIMIT clauses
- Output ONLY the SQL query, no markdown, no explanation

Schema (with types and sample data):
{json.dumps(schema, indent=2)}

User Query:
{query}

SQL:"""
    
    try:
        sql = await _call_llm(prompt, model, 0.1)
        if "```sql" in sql:
            sql = sql.split("```sql")[1].split("```")[0]
        elif "```" in sql:
            sql = sql.split("```")[1].split("```")[0]
        return sql.strip()
    except Exception as e:
        print(f"LLM Error: {e}")
    return ""

def validate_sql(sql_query: str) -> tuple[bool, str]:
    if not sql_query:
        return False, "Empty query"
    try:
        # Use sqlglot to parse the query
        parsed = sqlglot.parse(sql_query, read="duckdb")
        if not parsed:
            return False, "Could not parse query"
            
        # Dangerous DuckDB functions that could exfiltrate files or execute code
        BLOCKED_FUNCTIONS = {
            'read_csv_auto', 'read_csv', 'read_parquet', 'read_json_auto',
            'read_json', 'read_text', 'read_blob', 'glob',
            'load_extension', 'install_extension', 'postgres_scan', 'sqlite_scan'
        }

        for expression in parsed:
            if not expression: continue
            
            # 1. Statement Type Check: Only allow SELECT
            if not isinstance(expression, exp.Select):
                return False, "Only SELECT queries are allowed for security reasons."
                
            # 2. AST Deep Walk: Block dangerous functions and keyword bypasses
            for node in expression.walk():
                # Check for blocked function calls
                if isinstance(node, exp.Anonymous) and node.name.lower() in BLOCKED_FUNCTIONS:
                    return False, f"Function '{node.name}' is not allowed."
                
                # Double check for function calls disguised as identifiers in some contexts
                if isinstance(node, exp.Identifier) and node.this.lower() in BLOCKED_FUNCTIONS:
                    return False, f"Call to '{node.this}' is not allowed."

        return True, ""
    except Exception as e:
        return False, f"Syntax error: {str(e)}"

async def generate_explanation(sql: str, model: str) -> str:
    prompt = f"""Analyze the following DuckDB SQL query and provide high-value AI Insights.
    
    SQL Query:
    {sql}
    
    Guidelines for your response:
    - START with a single concise summary line that explains the business purpose of this query.
    - NEVER use conversational filler (e.g., "Sure", "I'd be happy", "Here's the breakdown").
    - USE a structured format with headers: "### Strategic Analysis", "### Data Impact", or "### Key Findings".
    - Explain the "WHY" (the business value) not just the "WHAT" (the code).
    - Format as a clear list of technical bullet points for the analysis.
    - Maintain a professional, executive tone.
    """
    try:
        return await _call_llm(prompt, model, 0.1)
    except Exception as e:
        print(f"Explanation Error: {e}")
    return "Strategic analysis unavailable."

async def fix_sql_with_llm(sql: str, error_msg: str, schema: dict, model: str) -> str:
    prompt = f"""The following DuckDB SQL failed with an error:

SQL:
{sql}

Error:
{error_msg}

Fix the query using the schema provided. Return ONLY corrected SQL.

Schema:
{json.dumps(schema, indent=2)}
"""
    try:
        new_sql = await _call_llm(prompt, model, 0.1)
        if "```sql" in new_sql:
            new_sql = new_sql.split("```sql")[1].split("```")[0]
        elif "```" in new_sql:
            new_sql = new_sql.split("```")[1].split("```")[0]
        return new_sql.strip()
    except:
        pass
    return sql

@app.get("/api/schema")
async def schema_endpoint(request: Request):
    conn = get_session_conn(request)
    schema = get_schema(conn)
    return sanitize_data(schema)

@app.get("/api/health")
async def health_check():
    ollama_ok = False
    models = []
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if r.status_code == 200:
                ollama_ok = True
                models = [m["name"] for m in r.json().get("models", [])]
    except:
        pass
    
    return {
        "status": "ok",
        "database": "DuckDB",
        "ollama": ollama_ok,
        "models": models,
        "endpoint": "http://localhost:3001"
    }

@app.post("/api/upload")
async def api_upload_file(request: Request, file: UploadFile = File(...)):
    conn = get_session_conn(request)
    # 1. Path Traversal & Injection Fix: Sanitize and use UUID
    original_name = os.path.basename(file.filename or "upload")
    ext = os.path.splitext(original_name)[1].lower()
    
    if ext not in (".csv", ".parquet"):
        raise HTTPException(status_code=400, detail="Unsupported file type. Use .csv or .parquet")

    os.makedirs(os.path.join("data", "uploads"), exist_ok=True)
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join("data", "uploads", safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 2. Table Name Sanitization
    table_name = re.sub(r'[^a-zA-Z0-9]', '_', original_name.split('.')[0]).lower()
    if table_name and table_name[0].isdigit():
        table_name = "t_" + table_name
        
    try:
        # 3. SQL Injection Fix: Parameterize file path and quote table name
        try:
            conn.execute(f'DROP TABLE IF EXISTS "{table_name}"')
            if ext == ".csv":
                conn.execute(f'CREATE TABLE "{table_name}" AS SELECT * FROM read_csv_auto(?)', [file_path])
            elif ext == ".parquet":
                conn.execute(f'CREATE TABLE "{table_name}" AS SELECT * FROM read_parquet(?)', [file_path])
            # Clear embedding for new table so it regenerates
            conn.execute("DELETE FROM schema_embeddings WHERE table_name = ?", [table_name])
        except Exception as sql_err:
            error_msg = str(sql_err)
            if "locked" in error_msg.lower():
                raise Exception("Database is currently busy. Please try again in a few seconds.")
            raise sql_err
            
        # Cleanup file on success (data is now in DuckDB)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {"status": "success", "table": table_name}
    except Exception as e:
        # Cleanup file on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        print(f"Upload error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/sql/generate", response_model=GenerateResponse)
async def api_generate_sql(req: QueryRequest, request: Request):
    conn = get_session_conn(request)
    schema = get_schema(conn)
    sql = await generate_sql(req.query, schema, req.model)
    return {"sql": sql}

class ExecuteRequest(BaseModel):
    sql: str
    page: int = 1
    pageSize: int = 50

@app.post("/api/sql/execute")
async def api_execute_sql(req: ExecuteRequest, request: Request):
    conn = get_session_conn(request)
    valid, err = validate_sql(req.sql)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Invalid SQL: {err}")
        
    try:
        c = conn.cursor()
        
        # Server-side pagination
        clean_sql = req.sql.strip()
        if clean_sql.endswith(';'):
            clean_sql = clean_sql[:-1]
            
        count_sql = f"SELECT COUNT(*) FROM ({clean_sql}) AS _sub"
        total_rows = c.execute(count_sql).fetchone()[0]
        
        offset = (req.page - 1) * req.pageSize
        exec_sql = f"SELECT * FROM ({clean_sql}) AS _sub LIMIT {req.pageSize} OFFSET {offset}"

        c.execute(exec_sql)
        result = c.fetchall()
        columns = [desc[0] for desc in c.description]
        
        dict_result = []
        for row in result:
            dict_result.append(sanitize_data(dict(zip(columns, row))))
            
        return {
            "rows": dict_result, 
            "columns": columns,
            "pagination": {
                "page": req.page,
                "pageSize": req.pageSize,
                "totalRows": total_rows,
                "totalPages": math.ceil(total_rows / req.pageSize)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Execution error: {str(e)}")

@app.post("/api/sql/run", response_model=RunResponse)
async def api_run_pipeline(req: QueryRequest, request: Request):
    conn = get_session_conn(request)
    schema = get_schema(conn)
    sql = await generate_sql(req.query, schema, req.model)
    
    max_val_retries = 2
    max_exec_retries = 1
    
    # Validation Loop
    valid = False
    error_msg = ""
    for attempt in range(max_val_retries + 1):
        valid, error_msg = validate_sql(sql)
        if valid:
            break
        if attempt < max_val_retries:
            sql = await fix_sql_with_llm(sql, error_msg, schema, req.model)

    if not valid:
        return {
            "sql": sql, "result": [], "columns": [],
            "explanation": "Failed to generate valid SQL syntax.",
            "validation": {"valid": False, "error": error_msg}
        }

    # Execution Loop (Task 2.2)
    dict_result = []
    columns = []
    exec_success = False
    exec_error = ""
    
    for attempt in range(max_exec_retries + 1):
        try:
            # Apply row limit
            exec_sql = sql.strip()
            if exec_sql.endswith(';'):
                exec_sql = exec_sql[:-1]
                
            if 'limit' not in exec_sql.lower():
                exec_sql = f"SELECT * FROM ({exec_sql}) AS _sub LIMIT {MAX_ROWS}"

            cursor = conn.cursor()
            cursor.execute(exec_sql)
            result = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
            
            dict_result = []
            for row in result:
                dict_result.append(sanitize_data(dict(zip(columns, row))))
            exec_success = True
            break
        except Exception as e:
            exec_error = str(e)
            if attempt < max_exec_retries:
                sql = await fix_sql_with_llm(sql, exec_error, schema, req.model)
                # Re-validate fixed SQL
                valid, error_msg = validate_sql(sql)
                if not valid:
                    break
            else:
                break

    if not exec_success:
        return {
            "sql": sql, "result": [], "columns": [],
            "explanation": f"Execution failed: {exec_error}",
            "validation": {"valid": False, "error": exec_error}
        }
        
    explanation = await generate_explanation(sql, req.model)
    
    return {
        "sql": sql,
        "result": dict_result,
        "columns": columns,
        "explanation": explanation,
        "validation": {"valid": True}
    }

@app.get("/api/sql/stream")
async def stream_pipeline(query: str, model: str, request: Request):
    conn = get_session_conn(request)
    async def event_generator():
        # Step 1: Schema Extraction & RAG
        yield f"data: {json.dumps({'event': 'status', 'data': 'Extracting and analyzing schema...'})}\n\n"
        schema = get_schema(conn, query)
        
        # Step 2: Generate SQL stream
        yield f"data: {json.dumps({'event': 'status', 'data': 'Generating SQL...'})}\n\n"
        
        prompt = f"""You are an expert SQL generator for DuckDB.
Rules:
- Only use tables and columns from the provided schema
- Never hallucinate tables or columns
- Use DuckDB SQL syntax (not PostgreSQL)
- Use efficient queries with appropriate LIMIT clauses
- Output ONLY the SQL query, no markdown, no explanation

Schema:
{json.dumps(schema, indent=2)}

User Query:
{query}

SQL:"""

        sql = ""
        yield f"data: {json.dumps({'event': 'sql_start'})}\n\n"
        async for chunk in _stream_llm(prompt, model):
            if await request.is_disconnected():
                return
            sql += chunk
            # Stream partial SQL
            yield f"data: {json.dumps({'event': 'sql_chunk', 'data': chunk})}\n\n"
        
        if "```sql" in sql:
            sql = sql.split("```sql")[1].split("```")[0]
        elif "```" in sql:
            sql = sql.split("```")[1].split("```")[0]
        sql = sql.strip()
        
        yield f"data: {json.dumps({'event': 'sql_done', 'data': sql})}\n\n"
        
        # Step 3: Validation
        yield f"data: {json.dumps({'event': 'status', 'data': 'Validating syntax...'})}\n\n"
        valid, error_msg = validate_sql(sql)
        
        if not valid:
            yield f"data: {json.dumps({'event': 'error', 'data': f'Validation Failed: {error_msg}'})}\n\n"
            return
            
        yield f"data: {json.dumps({'event': 'validation', 'data': {'valid': True}})}\n\n"
        
        # Step 4: Execution
        yield f"data: {json.dumps({'event': 'status', 'data': 'Executing query...'})}\n\n"
        
        import threading
        
        # We will run the query in a separate thread so we can check for disconnects
        class QueryRunner(threading.Thread):
            def __init__(self):
                super().__init__()
                self.result = None
                self.error = None
                
            def run(self):
                try:
                    c = conn.cursor()
                    clean_sql = sql.strip()
                    if clean_sql.endswith(';'):
                        clean_sql = clean_sql[:-1]
                    exec_sql = f"SELECT * FROM ({clean_sql}) AS _sub LIMIT 50" # First page preview
                    c.execute(exec_sql)
                    res = c.fetchall()
                    cols = [desc[0] for desc in c.description]
                    self.result = (res, cols)
                except Exception as e:
                    self.error = str(e)

        runner = QueryRunner()
        runner.start()
        
        import asyncio
        while runner.is_alive():
            if await request.is_disconnected():
                print("Client disconnected, interrupting DuckDB query!")
                conn.interrupt()
                return
            await asyncio.sleep(0.1)

        if runner.error:
            yield f"data: {json.dumps({'event': 'error', 'data': f'Execution Failed: {runner.error}'})}\n\n"
            return
            
        result, columns = runner.result
        
        dict_result = []
        for row in result:
            dict_result.append(sanitize_data(dict(zip(columns, row))))
            
        yield f"data: {json.dumps({'event': 'result', 'data': {'rows': dict_result, 'columns': columns}})}\n\n"

        # Step 5: Streaming Explanation
        yield f"data: {json.dumps({'event': 'status', 'data': 'Analyzing business impact...'})}\n\n"
        exp_prompt = f"""Analyze this DuckDB SQL query and provide high-value AI Insights.
SQL: {sql}
Guidelines:
- START with a single concise summary line explaining business purpose.
- Format as clear technical bullet points.
- Executive tone."""

        yield f"data: {json.dumps({'event': 'exp_start'})}\n\n"
        async for chunk in _stream_llm(exp_prompt, model):
            if await request.is_disconnected():
                return
            yield f"data: {json.dumps({'event': 'exp_chunk', 'data': chunk})}\n\n"
            
        yield f"data: {json.dumps({'event': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3001, reload=False)
