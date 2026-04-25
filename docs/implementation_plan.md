# SQL Query Generator — Fix Implementation Plan

> 4 phases, 27 fixes, ordered by risk. Each phase should be completed and tested before moving to the next.

---

## Phase 1: Security & Stability (P0 — Must Fix First)
**Goal:** Make the system safe to run. Nothing else matters until these are done.  
**Estimated effort:** 2-3 hours

---

### Task 1.1 — Block dangerous DuckDB functions in SQL validation
**Files:** `backend/main.py` → `validate_sql()`  
**Audit refs:** 5.1, 5.4, 7.1

**What to do:**
1. Replace the substring-based keyword blocklist with sqlglot AST analysis
2. Walk the parsed AST and reject any node that is not `exp.Select` (including unions, subqueries)
3. Block DuckDB filesystem functions: `read_csv_auto`, `read_parquet`, `read_json_auto`, `read_json`, `read_csv`, `read_text`, `glob`, `read_blob`
4. Block DuckDB extension functions: `load_extension`, `install_extension`
5. Block statements: `COPY`, `ATTACH`, `LOAD`, `INSTALL`, `EXPORT`, `IMPORT`, `PRAGMA`
6. Add DuckDB config on connection: `conn.execute("SET disabled_filesystems='LocalFileSystem'")`

**Concrete change:**
```python
def validate_sql(sql_query: str) -> tuple[bool, str]:
    if not sql_query:
        return False, "Empty query"
    try:
        parsed = sqlglot.parse(sql_query, read="duckdb")
        if not parsed:
            return False, "Could not parse query"
        
        for expression in parsed:
            if not expression:
                continue
            # Only allow SELECT statements (blocks DROP, INSERT, UPDATE, DELETE, COPY, etc.)
            if not isinstance(expression, exp.Select):
                return False, "Only SELECT queries are allowed."
        
        # Walk the full AST for dangerous function calls
        BLOCKED_FUNCTIONS = {
            'read_csv_auto', 'read_csv', 'read_parquet', 'read_json_auto',
            'read_json', 'read_text', 'read_blob', 'glob',
            'load_extension', 'install_extension',
        }
        for node in parsed[0].walk():
            if isinstance(node, exp.Anonymous) and node.name.lower() in BLOCKED_FUNCTIONS:
                return False, f"Function '{node.name}' is not allowed."
            if isinstance(node, exp.Column):
                # Check for function-style column references
                pass
                
        return True, ""
    except Exception as e:
        return False, str(e)
```

---

### Task 1.2 — Fix path traversal in file upload
**Files:** `backend/main.py` → `api_upload_file()`  
**Audit ref:** 3.3, 7.2

**What to do:**
1. Strip directory components from filename using `os.path.basename()`
2. Generate a UUID-based filename to prevent collisions and injection
3. Validate file extension before saving

```python
import uuid

@app.post("/api/upload")
async def api_upload_file(file: UploadFile = File(...)):
    # Sanitize filename
    original_name = os.path.basename(file.filename or "upload")
    ext = os.path.splitext(original_name)[1].lower()
    
    if ext not in ('.csv', '.parquet'):
        raise HTTPException(status_code=400, detail="Only .csv and .parquet files are supported.")
    
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    os.makedirs("uploads", exist_ok=True)
    file_path = os.path.join("uploads", safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Table name from original filename (already sanitized via regex)
    table_name = re.sub(r'[^a-zA-Z0-9]', '_', original_name.split('.')[0]).lower()
    if table_name and table_name[0].isdigit():
        table_name = "t_" + table_name
    # ... rest of ingestion
```

---

### Task 1.3 — Fix SQL injection via filename in upload
**Files:** `backend/main.py` → `api_upload_file()`  
**Audit ref:** 3.2, 7.3

**What to do:**
1. The `file_path` used in `read_csv_auto('{file_path}')` must be sanitized — Task 1.2 already fixes this by using a UUID filename
2. Additionally, use DuckDB's parameterized approach or validate that `table_name` contains only `[a-zA-Z0-9_]`
3. Quote the table name using double quotes in SQL

```python
# After Task 1.2, file_path is already safe (UUID-based)
# Additional safety: quote the table name
conn.execute(f'DROP TABLE IF EXISTS "{table_name}"')
conn.execute(f'CREATE TABLE "{table_name}" AS SELECT * FROM read_csv_auto(?)', [file_path])
```

---

### Task 1.4 — Fix substring-based SQL validation false positives
**Files:** `backend/main.py` → `validate_sql()`  
**Audit ref:** 5.1

**What to do:**
- Task 1.1 already replaces the substring approach with AST analysis
- Delete the entire `forbidden = ["DROP", "DELETE", ...]` block
- The `isinstance(expression, exp.Select)` check already handles this correctly

---

### Task 1.5 — Fix concurrent DuckDB access
**Files:** `backend/main.py`  
**Audit ref:** 3.1

**What to do:**
1. Add a threading lock around all DuckDB operations
2. Use cursor-per-request pattern

```python
import threading

db_lock = threading.Lock()
conn = duckdb.connect('data.db')

# Then wrap every conn usage:
def get_schema() -> dict:
    with db_lock:
        tables_result = conn.execute("SHOW TABLES;").fetchall()
        # ... etc

# For execute endpoints, create cursors within the lock:
with db_lock:
    cursor = conn.cursor()
    cursor.execute(sql)
    result = cursor.fetchall()
```

---

## Phase 2: Backend Reliability & Pipeline (P1 Backend)
**Goal:** Make the backend actually work correctly under real conditions.  
**Estimated effort:** 2-3 hours  
**Depends on:** Phase 1 complete

---

### Task 2.1 — Switch from synchronous `requests` to async `httpx`
**Files:** `backend/main.py`, `backend/requirements.txt`  
**Audit ref:** 3.5, 6.1

**What to do:**
1. `pip install httpx` and add to requirements.txt
2. Replace all `requests.post()` calls with `httpx.AsyncClient` calls
3. Make `generate_sql()`, `generate_explanation()`, and the retry logic `async`
4. Make endpoint handlers `async def`

```python
import httpx

async def generate_sql(query: str, schema: dict, model: str) -> str:
    prompt = f"""..."""
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post("http://localhost:11434/api/generate", json={
            "model": model, "prompt": prompt, "stream": False, "temperature": 0.1
        })
        if response.status_code == 200:
            sql = response.json().get("response", "").strip()
            # ... parse out markdown
            return sql.strip()
    return ""
```

---

### Task 2.2 — Add execution-error retry loop
**Files:** `backend/main.py` → `api_run_pipeline()`  
**Audit ref:** 4.2

**What to do:**
1. After SQL passes validation but fails at `conn.execute()`, feed the DuckDB error message back to the LLM for correction
2. Retry execution up to 2 times

```python
# After validation passes, in the execute block:
exec_retries = 2
exec_error = ""
for exec_attempt in range(exec_retries + 1):
    try:
        with db_lock:
            cursor = conn.cursor()
            cursor.execute(sql)
            result = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
        break  # success
    except Exception as e:
        exec_error = str(e)
        if exec_attempt < exec_retries:
            # Ask LLM to fix the execution error
            sql = await fix_sql_with_llm(sql, exec_error, schema, req.model)
            valid, val_err = validate_sql(sql)
            if not valid:
                break
```

---

### Task 2.3 — Add server-side row limit
**Files:** `backend/main.py` → `api_execute_sql()`  
**Audit ref:** 5.2, 6.3

**What to do:**
1. Before executing, inject a LIMIT if one doesn't exist
2. Return a `truncated` flag in the response

```python
MAX_ROWS = 10000

# In execute endpoint, after validation:
if 'limit' not in req.sql.lower():
    exec_sql = f"SELECT * FROM ({req.sql}) AS _sub LIMIT {MAX_ROWS}"
else:
    exec_sql = req.sql
```

---

### Task 2.4 — Enrich schema endpoint with types, row counts, and preview
**Files:** `backend/main.py` → `get_schema()`  
**Audit ref:** 1.3, 4.1

**What to do:**
1. Return column types from `PRAGMA table_info`
2. Return row counts via `SELECT COUNT(*)`
3. Return 5 preview rows per table
4. Return a DDL string

```python
def get_schema() -> dict:
    with db_lock:
        tables_result = conn.execute("SHOW TABLES;").fetchall()
        tables = [row[0] for row in tables_result]
        schema_info = {"tables": []}
        for t in tables:
            cols_result = conn.execute(f'PRAGMA table_info("{t}");').fetchall()
            columns = [{"name": row[1], "type": row[2]} for row in cols_result]
            
            row_count = conn.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
            
            preview = []
            preview_result = conn.execute(f'SELECT * FROM "{t}" LIMIT 5').fetchall()
            preview_cols = [c["name"] for c in columns]
            for row in preview_result:
                preview.append(dict(zip(preview_cols, row)))
            
            schema_info["tables"].append({
                "name": t,
                "columns": columns,
                "rowCount": row_count,
                "preview": preview
            })
        return schema_info
```

---

### Task 2.5 — Add health check endpoint
**Files:** `backend/main.py`  
**Audit ref:** 1.4, 8.6

```python
@app.get("/api/health")
async def health_check():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get("http://localhost:11434/api/tags")
            ollama_ok = r.status_code == 200
    except:
        pass
    
    return {
        "backend": True,
        "database": True,  # if we got here, DuckDB is fine
        "ollama": ollama_ok,
        "endpoint": "http://localhost:3001"
    }
```

---

### Task 2.6 — Restrict CORS
**Files:** `backend/main.py`  
**Audit ref:** 7.4

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Task 2.7 — Enrich LLM prompt with column types and sample data
**Files:** `backend/main.py` → `generate_sql()`  
**Audit ref:** 4.1, 4.5

**What to do:**
1. Include column types in the schema JSON passed to the prompt
2. Include 3 sample rows per table
3. Specify that the engine is DuckDB (not PostgreSQL)

```python
def generate_sql(query: str, schema: dict, model: str) -> str:
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
```

---

## Phase 3: Frontend Cleanup & Wiring (P1 Frontend)
**Goal:** Delete dead code, connect the UI to real data, fix state management.  
**Estimated effort:** 3-4 hours  
**Depends on:** Phase 2 complete (enriched schema endpoint needed)

---

### Task 3.1 — Delete dead code
**Files to delete:**
- `src/store/useStore.ts` (duplicate store)
- `src/components/Navigation.tsx` (unused dark-themed nav)
- `src/App.css` (Vite starter template CSS)

**Files to audit for stale imports:**
- `src/components/ModelSelector.tsx` — uses `'fast' | 'balanced' | 'powerful'` types from the deleted store. Either delete this component (it's not rendered anywhere) or rewire it to `queryStore`.

---

### Task 3.2 — Pass model config from store to API calls
**Files:** `src/api/llm.ts`, `src/components/QueryInput.tsx`  
**Audit ref:** 4.3, 4.4

**What to do:**
1. `generateSQL()` must accept model from caller, not hardcode it
2. `QueryInput` must read `modelConfig` from store and pass it

```typescript
// src/api/llm.ts
export const generateSQL = async (query: string, model: string): Promise<{ sql: string; explanation: string }> => {
  const res = await fetch(`${API_URL}/sql/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, model })
  });
  // ...
};

// src/components/QueryInput.tsx — in the mutation call:
const { modelConfig } = useQueryStore();
generateMutation.mutate({ query, model: modelConfig.type });
```

---

### Task 3.3 — Fix QueryInput: add missing `setValidation` + stale closure
**Files:** `src/components/QueryInput.tsx`  
**Audit ref:** 2.4, 2.7

**What to do:**
1. Add `setValidation` to the destructured store values
2. Wrap `handleExecute` in `useCallback`
3. Use a ref for the keyboard shortcut to avoid stale closure

```typescript
const { query, setQuery, setSql, setStatus, setResult, status, sql, validation, setValidation, addToHistory, modelConfig } = useQueryStore();

const handleExecuteRef = useRef(handleExecute);
handleExecuteRef.current = handleExecute;

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecuteRef.current();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []); // stable — no stale closure
```

---

### Task 3.4 — Fix History page: render real data
**Files:** `src/pages/History.tsx`  
**Audit ref:** 1.2

**What to do:**
1. Delete the `mockHistory` array (L25-L45)
2. Render `history` from the store
3. Wire up the search bar to filter history
4. Add `addToHistory()` calls in `QueryInput` on successful generation

```typescript
const [searchTerm, setSearchTerm] = useState('');
const filteredHistory = history.filter(item => 
  item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.sql.toLowerCase().includes(searchTerm.toLowerCase())
);
// Render filteredHistory instead of mockHistory
```

---

### Task 3.5 — Fix Schema page: use enriched backend data
**Files:** `src/pages/Schema.tsx`  
**Audit ref:** 1.3

**What to do:**
1. Update the `enrichedSchema` mapping to use real column types, row counts, and preview data from the new backend response (Task 2.4)
2. Remove hardcoded `'N/A'` values

```typescript
const enrichedSchema = tables.map((t: any) => ({
  name: t.name,
  schema: 'public',
  rows: t.rowCount?.toLocaleString() ?? 'N/A',
  columns: t.columns, // now has { name, type } from backend
  preview: t.preview ?? [],
  ddl: generateDDL(t) // build from column info
}));
```

---

### Task 3.6 — Fix Settings page: show real status, fix model types
**Files:** `src/pages/Settings.tsx`  
**Audit ref:** 1.4, 1.5

**What to do:**
1. Add a `useQuery` call to `/api/health` to get real system status
2. Replace the hardcoded API endpoint and "Operational" label
3. Change model selector from `'fast' | 'balanced' | 'powerful'` to match `queryStore` types (`'qwen2.5-coder:3b'`, `'qwen2.5-coder:7b'`, `'custom'`)

---

### Task 3.7 — Fix SQL Editor label and suggestions
**Files:** `src/components/SQLEditor.tsx`, `src/components/QueryInput.tsx`  
**Audit ref:** 1.7, 1.9

**What to do:**
1. Change "PostgreSQL Engine" to "DuckDB Engine" in SQLEditor L47
2. Replace hardcoded suggestions in QueryInput with dynamic ones based on actual schema:

```typescript
const { data: schemaData } = useQuery({ queryKey: ['schema'], queryFn: fetchSchema });
const suggestions = useMemo(() => {
  const tables = schemaData?.tables || [];
  if (tables.length === 0) return ["Show me all available tables"];
  return tables.slice(0, 4).map(t => `Show me the first 10 rows from ${t.name}`);
}, [schemaData]);
```

---

### Task 3.8 — Fix Setup page: remove fake features
**Files:** `src/pages/Setup.tsx`  
**Audit ref:** 3.8, 8.7, 8.8

**What to do:**
1. Remove `.sqlite` and `.db` from the file input accept list (L75) — backend doesn't support them
2. Either remove "Connect a database" button entirely or disable it with a "Coming soon" badge
3. Remove the fake "Recent:" items at the bottom (L124-L128)
4. Either wire up the Custom API input to actually be used, or remove it

---

### Task 3.9 — Use Zustand selectors to prevent unnecessary re-renders
**Files:** All components using `useQueryStore()`  
**Audit ref:** 2.5

**What to do:**
```typescript
// Instead of:
const { result, status } = useQueryStore();

// Use:
const result = useQueryStore(s => s.result);
const status = useQueryStore(s => s.status);
```

Apply to: `ResultTable`, `SQLEditor`, `ValidationPanel`, `QueryHistory`, `SchemaViewer`, `Sidebar`, `TopBar`.

---

### Task 3.10 — Rename package
**Files:** `package.json`  
**Audit ref:** 9 (P2 #27)

Change `"name": "temp_app"` to `"name": "sql-query-generator"`.

---

## Phase 4: Polish & Missing Features (P2)
**Goal:** Turn "works" into "good."  
**Estimated effort:** 4-6 hours  
**Depends on:** Phase 3 complete

---

### Task 4.1 — Add result export (CSV/JSON)
**Files:** `src/components/TopBar.tsx`, new utility function  
**Audit ref:** 8.1

Wire the Export button to download current results as CSV.

---

### Task 4.2 — Persist history to localStorage
**Files:** `src/store/queryStore.ts`  
**Audit ref:** 2.8

Use Zustand `persist` middleware:
```typescript
import { persist } from 'zustand/middleware';

export const useQueryStore = create<QueryState>()(
  persist(
    (set) => ({ /* existing state */ }),
    { name: 'sql-studio-store', partialize: (state) => ({ history: state.history }) }
  )
);
```

---

### Task 4.3 — Add Ollama health check banner
**Files:** `src/components/TopBar.tsx` or `MainLayout.tsx`  
**Audit ref:** 8.6

Poll `/api/health` on mount. If `ollama: false`, show a persistent warning banner.

---

### Task 4.4 — Add schema-aware autocomplete to Monaco
**Files:** `src/components/SQLEditor.tsx`  
**Audit ref:** 8.4

Register a `CompletionItemProvider` that suggests table names and column names from the schema query cache.

---

### Task 4.5 — Add result pagination
**Files:** `src/components/ResultTable.tsx`  
**Audit ref:** 6.3

Enable TanStack Table pagination (already installed):
```typescript
import { getPaginationRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data: result,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: { pagination: { pageSize: 50 } }
});
```

---

### Task 4.6 — Add query cancellation
**Files:** `src/components/QueryInput.tsx`, `src/api/llm.ts`  
**Audit ref:** 8.5

Use `AbortController` to cancel in-flight fetch requests, with a "Cancel" button shown during generation/execution.

---

## Execution Order Summary

| Phase | Focus | Tasks | Effort |
|-------|-------|-------|--------|
| **1** | 🔴 Security & Stability | 1.1–1.5 | 2-3h |
| **2** | 🟠 Backend Reliability | 2.1–2.7 | 2-3h |
| **3** | 🟡 Frontend Cleanup | 3.1–3.10 | 3-4h |
| **4** | 🟢 Polish & Features | 4.1–4.6 | 4-6h |

**Total: ~11-16 hours of focused work.**

> [!IMPORTANT]
> **Do not skip to Phase 3/4.** The security holes in Phase 1 mean the app is actively dangerous to run. Fix those first, even if the UI issues are more visible.
