# Developer Guide

## 🧩 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS v4 |
| **State Management** | Zustand (with localStorage persistence) |
| **Data Fetching** | TanStack Query v5 |
| **SQL Editor** | Monaco Editor |
| **Results Grid** | TanStack Table v8 |
| **Routing** | React Router v7 |
| **Backend** | FastAPI (Python), Uvicorn |
| **Database** | DuckDB (embedded, in-process) |
| **SQL Validation** | sqlglot |
| **LLM (Local)** | Ollama — `qwen2.5-coder:3b` / `7b` |
| **LLM (Cloud)** | OpenRouter (free tier models) |
| **HTTP Client** | httpx (async) |

## 🛠️ Run Manually (Local Development)

### 1. Clone the Repository

```bash
git clone https://github.com/Arthurs-excalibur/Sql-Query-generator.git
cd Sql-Query-generator
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```env
OPENROUTER_API_KEY=your_key_here   # Only needed for cloud models
```

Start the backend:

```bash
python main.py
```

The API will be available at `http://localhost:3001`.

### 3. Frontend Setup

From the project root:

```bash
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

## ☁️ Setting Up OpenRouter (Free Cloud LLM)

If you don't have Ollama installed or don't want to run a local model, you can use **OpenRouter** to access powerful free models like NVIDIA Nemotron, Google Gemma 2, and Qwen 2.

1. Go to [https://openrouter.ai](https://openrouter.ai) and sign up.
2. Get your API Key from your profile.
3. Inside the `backend/` folder, create or edit the `.env` file:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. Restart the backend and select the cloud model in the application setup screen.

## 🔑 Available API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/schema` | Fetch full DuckDB schema with column info and previews |
| `POST` | `/api/upload` | Upload a `.csv` or `.parquet` file |
| `GET` | `/api/sql/stream` | Full streaming pipeline (generate → validate → execute → explain) |
| `POST` | `/api/sql/generate` | Generate SQL from a natural language query |
| `POST` | `/api/sql/execute` | Execute a raw SQL string with pagination |
| `POST` | `/api/sql/run` | Non-streaming full pipeline (legacy) |

## 🧩 Component Overview

### Frontend Pages

| Component | Route | Description |
| :--- | :--- | :--- |
| `Setup` | `/` | Onboarding — connect data & configure model |
| `Workspace` | `/workspace` | Main query interface |
| `Schema` | `/schema` | Schema browser with DDL viewer |
| `UploadedFiles` | `/files` | Manage ingested datasets |
| `SavedQueries` | `/saved` | Bookmarked queries |
| `History` | `/history` | Full query history |
| `Settings` | `/settings` | Theme & model configuration |

## 🔒 Security

- **SQL Injection Prevention** — All generated SQL is parsed by `sqlglot`. Only `SELECT` statements are permitted. Dangerous DuckDB functions are blocked.
- **Path Traversal Protection** — Uploaded files are stored with UUID-generated names.
- **Secrets Management** — The OpenRouter API key is loaded from `.env` and never exposed to the frontend.

## 📁 Project Structure

```text
.
├── backend/
│   ├── main.py              # FastAPI app, endpoints, LLM orchestration
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # API keys (not committed)
├── src/
│   ├── api/
│   ├── components/
│   ├── pages/
│   ├── store/
│   └── index.css            # Design system / theme tokens
├── index.html
├── package.json
└── vite.config.ts
```
