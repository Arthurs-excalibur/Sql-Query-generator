# SQL Query Generator — Full System Audit

> **Verdict: This system will fail in real-world usage.** It is a prototype masquerading as a product. The architecture has fundamental safety holes, the frontend is riddled with dead code and split-brain state, and the LLM pipeline has no real guardrails. Below is the evidence.

---

## 1. UI / UX Audit

### 1.1 The workflow is broken for non-technical users
- The "Generate SQL" button produces SQL, then the *same button* morphs into "Run Query." There is zero visual cue that the user needs to press the button *again*. A non-technical user will think they're done after generation and stare at an empty result table.
- **Fix:** Make it a single-action pipeline (generate + execute) with an opt-out "Review before running" toggle, or use two permanently visible buttons.

### 1.2 History page is fake
- [History.tsx L25-L45](file:///f:/Development/SQL%20Query%20Generator/src/pages/History.tsx#L25-L45): The page renders a hardcoded `mockHistory` array. The actual `history` from the store is fetched (L16) but **never rendered**. Users see fabricated data ("Monthly revenue by region", "Top 10 customers by LTV") that has nothing to do with their real queries.
- The search bar on the history page (L80-L84) is **completely non-functional** — no `onChange` handler filters anything.
- The "Filter" button (L64-L67) does nothing.
- The "Load older history" button (L134-L136) does nothing.
- **Fix:** Delete the mock array. Render `history` from the store. Wire up the search input.

### 1.3 Schema page shows N/A for everything
- [Schema.tsx L23-L34](file:///f:/Development/SQL%20Query%20Generator/src/pages/Schema.tsx#L23-L34): Row count, size, primary key, foreign keys, indexes are all hardcoded to `'N/A'`. Column types are hardcoded to `'any'`. The "Raw Preview" section renders `currentTable.preview` which is always an empty array `[]`. Users see an elaborate UI with zero actual data.
- **Fix:** Query `PRAGMA table_info` for types, `SELECT COUNT(*)` for row counts, and `SELECT * LIMIT 5` for preview data from the backend.

### 1.4 Settings page lies about system status
- [Settings.tsx L120](file:///f:/Development/SQL%20Query%20Generator/src/pages/Settings.tsx#L120): The API endpoint is hardcoded as `https://api.internal.data/llm/v1` — this URL doesn't exist. The real backend is `http://localhost:3001`. Backend status is hardcoded as "Operational" with no health check. This actively misleads users.
- **Fix:** Add a `/api/health` endpoint and poll it.

### 1.5 Settings model selector is disconnected from the actual model
- [Settings.tsx L53](file:///f:/Development/SQL%20Query%20Generator/src/pages/Settings.tsx#L53): Settings offers "fast / balanced / powerful" but the `queryStore` model type is `'qwen2.5-coder:3b' | 'qwen2.5-coder:7b' | 'custom'`. These are **completely different type systems**. Changing the model in Settings does nothing because the types don't match the store.
- [llm.ts L7](file:///f:/Development/SQL%20Query%20Generator/src/api/llm.ts#L7): The model is **hardcoded** to `'qwen2.5-coder:3b'` anyway, ignoring whatever the store says.

### 1.6 TopBar is decorative
- The global search bar (TopBar L41-L48) has no handler.
- The Bell notification button (L51-L53) does nothing.
- The Help button (L54-L56) does nothing.
- The Export button (L60-L63) does nothing.
- The User avatar (L65-L67) does nothing.

### 1.7 SQL Editor says "PostgreSQL Engine"
- [SQLEditor.tsx L47](file:///f:/Development/SQL%20Query%20Generator/src/components/SQLEditor.tsx#L47): The label says "PostgreSQL Engine" but the actual backend is **DuckDB**. This will confuse every user who tries PostgreSQL-specific syntax.

### 1.8 Missing error recovery
- When LLM generation fails, the user sees "error" status with a red message but **no retry button**. They must manually clear and re-type their query.
- When execution fails after validation passes (runtime DuckDB error), the user gets a generic error with no guidance.

### 1.9 Suggestions reference non-existent data
- [QueryInput.tsx L72-L77](file:///f:/Development/SQL%20Query%20Generator/src/components/QueryInput.tsx#L72-L77): Suggestions like "List products with stock below 100" and "Average order value by region" reference tables/columns (`products`, `stock`, `region`) that don't exist in the schema. Clicking these will generate failing SQL 100% of the time.
- The "Recent" items on the Setup page (L126-L127: "Sales_Q1_Report.csv", "E-commerce DB") are also fabricated.

---

## 2. Frontend Architecture Audit

### 2.1 Two competing state stores — split-brain state
- `useStore.ts` and `queryStore.ts` both exist. Both define `ModelConfig`, `Validation`, status types, and near-identical state shapes. The actual app uses `queryStore` — `useStore.ts` is **dead code** that will confuse every future contributor.
- The `ModelConfig` in `useStore` uses `'fast' | 'balanced' | 'powerful'`. The `ModelConfig` in `queryStore` uses `'qwen2.5-coder:3b' | 'qwen2.5-coder:7b' | 'custom'`. These are irreconcilable.
- **Fix:** Delete `useStore.ts` entirely.

### 2.2 Two competing navigation components
- `Navigation.tsx` and `Sidebar.tsx` both exist. `Navigation.tsx` has a completely different dark-themed design system (`bg-[#1a1a1a]`, `text-[#555]`), references `border-color`, `panel-bg`, `accent-color` CSS variables that don't exist in the current theme. It uses `clsx` + `tailwind-merge` for a `cn()` helper used nowhere else. It is **dead code**.
- **Fix:** Delete `Navigation.tsx`.

### 2.3 `App.css` is entirely dead code
- 185 lines of CSS (`.counter`, `.hero`, `#center`, `#next-steps`, `#spacer`, `.ticks`) — this is the **Vite starter template CSS** that was never removed. None of these classes are referenced anywhere.
- **Fix:** Delete `App.css`.

### 2.4 Stale closure bug in keyboard shortcut
- [QueryInput.tsx L52-L61](file:///f:/Development/SQL%20Query%20Generator/src/components/QueryInput.tsx#L52-L61): The `useEffect` registers a `keydown` listener that calls `handleExecute`, but the dependency array is `[query, sql, status]`. `handleExecute` is recreated every render but the effect captures a stale reference. Additionally, `setValidation` is used inside `generateMutation` callbacks (L19, L23) but is destructured outside — this works due to Zustand's stable references, but the `handleExecute` closure itself is stale.
- **Fix:** Use `useCallback` for `handleExecute` or use a ref.

### 2.5 Unnecessary re-renders
- Every component subscribes to the entire store via `useQueryStore()` destructuring. When `sql` changes, `ResultTable` re-renders even though it only needs `result` and `status`. When `query` changes, `SQLEditor` re-renders even though it only needs `sql`.
- Zustand supports selectors: `useQueryStore(s => s.result)`. None are used.
- **Fix:** Use granular selectors everywhere.

### 2.6 `result: any[]` throughout
- Both stores, both API clients, and `ResultTable` all type results as `any[]`. There is zero type safety for the most critical data in the app.

### 2.7 `setValidation` is called but not imported in QueryInput
- [QueryInput.tsx L9-L11](file:///f:/Development/SQL%20Query%20Generator/src/components/QueryInput.tsx#L9-L11): `setValidation` is not destructured from the store, but it's used in L19 and L23 inside mutation callbacks. This is either a bug that silently fails or it's resolved from the outer scope — inspection shows it's **not destructured**. This means `setValidation` is `undefined` and the error/success validation state is never actually set from query mutations.

### 2.8 History is never persisted
- History lives only in Zustand memory. Refresh the page → all history is gone. There is no `localStorage`, no backend persistence.

---

## 3. Backend Architecture Audit

### 3.1 Global mutable DuckDB connection with no concurrency protection
- [main.py L45](file:///f:/Development/SQL%20Query%20Generator/backend/main.py#L45): A single `conn = duckdb.connect('data.db')` is shared across all request handlers. DuckDB is not designed for concurrent write access from multiple threads. FastAPI/uvicorn handles requests concurrently. Two simultaneous `/api/upload` calls or a `/api/upload` concurrent with `/api/sql/execute` **will corrupt the database or crash**.
- The previous conversation history confirms this: conversation `88e243bc` was literally titled "Resolving Backend Database Lock."
- **Fix:** Use a connection pool or per-request connections with a mutex.

### 3.2 SQL injection in the upload endpoint
- [main.py L194-L198](file:///f:/Development/SQL%20Query%20Generator/backend/main.py#L194-L198):
  ```python
  conn.execute(f"DROP TABLE IF EXISTS {table_name}")
  conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{file_path}')")
  ```
  The `table_name` is sanitized via regex, but `file_path` is `f"uploads/{file.filename}"` where `file.filename` comes directly from the HTTP request. A malicious filename like `'); DROP TABLE users; --` will execute arbitrary SQL.
- **Fix:** Use parameterized queries or validate/sanitize the filename.

### 3.3 Path traversal in file upload
- `file_path = f"uploads/{file.filename}"` — a filename like `../../etc/passwd` or `../main.py` will write outside the uploads directory.
- **Fix:** Use `os.path.basename(file.filename)` or generate a UUID filename.

### 3.4 No request size limits on file upload
- There is no limit on uploaded file size. A user can upload a 50GB CSV and crash the server.
- **Fix:** Add `UploadFile` size validation or configure uvicorn/nginx limits.

### 3.5 The `/api/sql/run` pipeline is synchronous and blocking
- The full pipeline (generate → validate → retry → execute → explain) makes up to **4 sequential HTTP calls to Ollama** (generate + 2 retries + explain), each with a 30-second timeout. Worst case: **120 seconds** of blocking a single worker thread.
- **Fix:** Use `async` HTTP calls (`httpx.AsyncClient`) instead of synchronous `requests`.

### 3.6 Schema query uses f-string interpolation
- [main.py L95](file:///f:/Development/SQL%20Query%20Generator/backend/main.py#L95): `conn.execute(f"PRAGMA table_info('{t}');")` — table names from `SHOW TABLES` are interpolated directly. While these come from the DB itself, it's still a bad pattern.

### 3.7 No authentication or rate limiting
- CORS is `allow_origins=["*"]`. Any website on the internet can make requests to this backend. No API keys, no auth, no rate limiting.

### 3.8 The "Connect a database" feature is a lie
- [Setup.tsx L93-L98](file:///f:/Development/SQL%20Query%20Generator/src/pages/Setup.tsx#L93-L98): It calls `prompt()` for a connection string, then calls `handleSelectSource('database', 'External Database', 'Connected via URI string')` which just **saves a label to the store**. It never actually connects to anything. The backend has no external database connection capability.

---

## 4. LLM Reliability Audit

### 4.1 The prompt is dangerously weak
- The schema injection dumps raw JSON with only column names — **no types, no constraints, no relationships, no sample data**. The model has to guess that `amount` is DECIMAL, that `customer_id` is a foreign key to `users.id`, etc.
- The prompt says "Avoid SELECT *" but provides no enforcement.
- The prompt says "Output only SQL" but the model frequently outputs markdown, explanations, or multiple queries. The only cleanup is a fragile `split("```")` parser.

### 4.2 The retry loop only retries validation failures, not execution failures
- [main.py L242-L277](file:///f:/Development/SQL%20Query%20Generator/backend/main.py#L242-L277): If SQL passes `validate_sql` (sqlglot parse) but fails at `conn.execute()` (runtime DuckDB error like "column not found"), there is **no retry**. The most common failure mode (hallucinated column names) is completely unhandled.

### 4.3 Model selection is hardcoded on the frontend
- [llm.ts L7](file:///f:/Development/SQL%20Query%20Generator/src/api/llm.ts#L7): `model: 'qwen2.5-coder:3b'` is hardcoded. The entire model selection UI (Setup wizard, Settings page, ModelSelector component) is theater.

### 4.4 Temperature and maxTokens are never sent to the backend
- The store tracks `temperature` and `maxTokens` but neither `generateSQL()` nor `runQuery()` in the API client sends them. The backend uses its own hardcoded `temperature: 0.1`.

### 4.5 Queries that will break it
- JOINs across uploaded tables (model doesn't know relationships)
- Aggregations with HAVING clauses (3B model frequently gets these wrong)
- Window functions (RANK, ROW_NUMBER — the model will hallucinate syntax)
- Date arithmetic ("show me orders from last 30 days" — DuckDB date functions differ from PostgreSQL)
- Any query referencing tables/columns not in the 2-table sample schema

---

## 5. SQL Safety & Validation Audit

### 5.1 The validation is bypassable
- [main.py L147-L148](file:///f:/Development/SQL%20Query%20Generator/backend/main.py#L147-L148): Only checks `isinstance(expression, exp.Select)`. But DuckDB supports `COPY`, `ATTACH`, `LOAD`, `INSTALL` — none of which are `exp.Select` but may not be in the forbidden list.
- The keyword blocklist (L152) checks `sql_upper` for substrings. The query `SELECT * FROM users WHERE name = 'DROPDOWN'` would be **blocked** because it contains "DROP". Similarly, `SELECT * FROM updated_records` is blocked because it contains "UPDATE".
- **Fix:** Use sqlglot's AST to check statement types, not substring matching.

### 5.2 The `/api/sql/execute` endpoint has no row limit
- A user can manually craft and send `SELECT * FROM huge_table` with millions of rows. The backend will attempt to serialize the entire result set into JSON, exhausting memory.
- **Fix:** Enforce `LIMIT 10000` or similar server-side.

### 5.3 `UNION`-based attacks
- `SELECT 1 UNION ALL SELECT load_extension('httpfs')` — the validation only checks if the top-level expression is a SELECT. UNION-injected statements may bypass the check.

### 5.4 DuckDB-specific dangerous functions are not blocked
- `read_csv_auto()`, `read_parquet()`, `read_json_auto()` can be used in SELECT to read arbitrary files from the filesystem.
- `SELECT * FROM read_csv_auto('/etc/passwd')` passes validation (it's a SELECT) and would exfiltrate system files.
- **Fix:** Block filesystem-access functions via sqlglot AST analysis or DuckDB's `SET disabled_filesystems` configuration.

---

## 6. Performance Audit

### 6.1 Ollama calls are synchronous `requests.post` inside an async FastAPI server
- This blocks the event loop. Under 3 concurrent users, the server becomes unresponsive because all worker threads are blocked waiting for Ollama.
- **Fix:** Use `httpx.AsyncClient` with `await`.

### 6.2 Monaco Editor loads ~3MB of JavaScript
- For a simple SQL editor with no autocomplete, no intellisense, no schema-aware suggestions — this is massive overhead. The editor doesn't even use Monaco's diagnostic features.
- Consider: CodeMirror 6 with SQL mode (~50KB).

### 6.3 No query result pagination
- `ResultTable` renders all rows at once. 10,000 rows = 10,000 DOM nodes. The browser will freeze.
- TanStack Table supports pagination — it's already installed but pagination is not configured.

### 6.4 Schema is re-fetched on every navigation
- No `staleTime` is set on the schema query. Every time the user navigates to Schema page, it re-fetches.

---

## 7. Security Audit

### 7.1 CRITICAL: Arbitrary file read via DuckDB functions
- As described in 5.4. `SELECT * FROM read_csv_auto('C:\\Users\\Arthur\\sensitive_file.txt')` will work.

### 7.2 CRITICAL: Path traversal in file upload
- As described in 3.3.

### 7.3 CRITICAL: SQL injection via filename
- As described in 3.2.

### 7.4 HIGH: No CORS restriction
- `allow_origins=["*"]` means any website can interact with the user's local backend.

### 7.5 HIGH: No request authentication
- Anyone on the local network can access the API.

### 7.6 MEDIUM: Database file (data.db) is in the backend root
- It's committed alongside code. No `.gitignore` entry is visible for `*.db` files in the backend directory.

---

## 8. Product Gaps

### 8.1 No data export
- The "Export" button in the TopBar does nothing. Users cannot download query results as CSV/JSON.

### 8.2 No query saving
- The "Saved Queries" nav item links to a placeholder page. There is no save functionality.

### 8.3 No multi-statement support
- Users cannot run multiple queries separated by semicolons.

### 8.4 No schema-aware autocomplete
- Monaco has powerful completion providers. None are configured. Users get generic SQL keywords but not table/column names.

### 8.5 No query cancellation
- Once a query is submitted, there is no way to cancel it. With Ollama's 30-second timeout, users are stuck waiting.

### 8.6 No Ollama availability check
- If Ollama is not running, the app silently fails with a generic error. There is no startup check, no helpful message like "Ollama is not running on port 11434."

### 8.7 No support for file formats beyond CSV/Parquet
- Setup page accepts `.sqlite` and `.db` in the file input (L75) but the backend only handles `.csv` and `.parquet` (L195-L198). Uploading a `.sqlite` file will throw "Unsupported file type."

### 8.8 Custom API endpoint does nothing
- The Setup wizard lets users enter a custom API URL (L194-L199) but it's never used by the backend or frontend API calls.

---

## 9. PRIORITIZED FIXES

### P0 — Critical (Must Fix)

| # | Problem | Impact | Fix |
|---|---------|--------|-----|
| 1 | **Arbitrary file read via DuckDB `read_csv_auto()` in SELECT** | Any user can read any file on the server filesystem | Block dangerous DuckDB functions (`read_csv_auto`, `read_parquet`, `read_json_auto`, `COPY`, `ATTACH`, `LOAD`, `INSTALL`) via sqlglot AST analysis before execution. Also set DuckDB `SET disabled_filesystems` |
| 2 | **Path traversal in file upload** | Attacker overwrites server files via crafted filename | Use `os.path.basename()` + UUID rename for uploaded files |
| 3 | **SQL injection via filename in upload** | Arbitrary SQL execution on the database | Sanitize or parameterize the file path in SQL statements |
| 4 | **Keyword-based SQL validation blocks legitimate queries** | `SELECT * FROM updated_at...` is blocked because it contains "UPDATE" | Replace substring matching with sqlglot AST statement-type checking |
| 5 | **Concurrent DB access corruption** | Two simultaneous requests corrupt `data.db` | Use a connection pool or threading lock around DuckDB operations |

### P1 — Important (Should Fix)

| # | Problem | Impact | Fix |
|---|---------|--------|-----|
| 6 | **Model selection is hardcoded in `llm.ts`** | Entire model config UI is non-functional | Pass `modelConfig.type` from the store to the API call |
| 7 | **History page renders mock data, not real history** | Users see fabricated data, real history is invisible | Delete `mockHistory`, render the `history` array from the store |
| 8 | **Two competing Zustand stores (`useStore` + `queryStore`)** | Confusion, bugs, type mismatches | Delete `useStore.ts`, keep only `queryStore.ts` |
| 9 | **Synchronous `requests.post` blocks the async event loop** | Server freezes under 2-3 concurrent users | Replace `requests` with `httpx.AsyncClient` and `await` |
| 10 | **No execution retry in `/api/sql/run`** | Most common failures (bad column names) are not retried | Add execution-error retry loop that feeds the DuckDB error back to the LLM |
| 11 | **No result row limit on `/api/sql/execute`** | Memory exhaustion on large tables | Enforce server-side `LIMIT` or pagination |
| 12 | **Dead code: `Navigation.tsx`, `App.css`, `useStore.ts`, `ModelSelector.tsx`** | Confuses contributors, bloats bundle | Delete all four files |
| 13 | **Schema page shows N/A for all metadata** | Users get zero value from the Schema browser | Fetch column types, row counts, and preview rows from backend |
| 14 | **Query suggestions reference non-existent tables** | Every suggestion click produces a failing query | Generate suggestions dynamically from the actual schema |
| 15 | **CORS `allow_origins=["*"]`** | Any website can interact with the backend | Restrict to `http://localhost:5173` |
| 16 | **`setValidation` not destructured in QueryInput** | Validation state never updates on generate/execute success or failure | Add `setValidation` to the destructured store values |

### P2 — Nice to Have

| # | Problem | Impact | Fix |
|---|---------|--------|-----|
| 17 | **SQL Editor label says "PostgreSQL Engine"** | Misleading, minor trust issue | Change to "DuckDB Engine" |
| 18 | **Settings page shows fake API endpoint and hardcoded "Operational"** | Misleading | Add `/api/health` endpoint, display real values |
| 19 | **No Ollama health check on startup** | Cryptic errors when Ollama isn't running | Add a check on app mount, show a clear banner |
| 20 | **No query result export** | Users can't use results outside the app | Wire the Export button to generate CSV/JSON download |
| 21 | **No schema-aware autocomplete in Monaco** | Users must memorize table/column names | Register a `CompletionItemProvider` with schema data |
| 22 | **Prompt missing column types, constraints, sample data** | LLM hallucinates types and joins | Enrich schema injection with full `PRAGMA` info and 3 sample rows |
| 23 | **History not persisted across refreshes** | All history lost on page reload | Persist to `localStorage` via Zustand `persist` middleware, or save to backend |
| 24 | **No result pagination in ResultTable** | Browser freezes on large result sets | Enable TanStack Table pagination (already installed) |
| 25 | **"Connect a database" does nothing** | Feature is a lie | Either implement it or remove the button |
| 26 | **Setup page accepts .sqlite/.db but backend rejects them** | User uploads a .sqlite file, gets an error | Either support SQLite ingestion or remove from the accept filter |
| 27 | **`package.json` name is "temp_app"** | Unprofessional | Rename to `sql-query-generator` or similar |

---

## Summary

This is a demo, not a product. The biggest issues:

1. **Security is non-existent.** Three separate injection/traversal vectors. DuckDB file-read functions are wide open. CORS is wildcarded.
2. **Half the UI is theater.** Fake history, fake schema metadata, fake system status, fake model selection, non-functional buttons everywhere.
3. **The LLM pipeline ignores user configuration.** Model, temperature, and max tokens are all hardcoded despite elaborate UI to configure them.
4. **The backend will corrupt under concurrent use.** A single shared DuckDB connection with no locking, plus synchronous HTTP calls blocking the async server.

Fix the P0s before showing this to anyone. Fix the P1s before calling it a product. The P2s are what separate "works" from "good."
