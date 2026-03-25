# ApexCrawl ↔ Apexverse Backend Interface

## Overview
Apexverse backend dispatches crawl jobs to ApexCrawl via HTTP.
ApexCrawl fires callbacks back to Apexverse as the job progresses.

---

## 1. Apexverse → ApexCrawl: Dispatch Job

POST http://apexcrawl:8060/jobs

Request body:
{
  "job_id": "uuid",                        // Apexverse run ID — use this everywhere
  "target_url": "https://docs.example.com",
  "js_rendering": false,
  "auto_chunking": true,
  "chunk_size": 512,
  "chunk_overlap": 50,
  "embedding_provider": "openai",          // "openai" | "cohere" | "none"
  "embedding_api_key": "sk-...",           // decrypted client key
  "embedding_model": "text-embedding-3-small",
  "vector_db": "pinecone",                 // "pinecone"|"qdrant"|"weaviate"|"pgvector"|"none"
  "vector_db_credentials": {              // decrypted credentials
    "api_key": "...",
    "environment": "us-east-1",
    "index_name": "my-index"
  },
  "page_quota_remaining": 49000,          // stop crawling if exceeded
  "callback_url": "http://backend:8050/projects/scraper-callback",
  "callback_secret": "shared_secret"
}

Response (202 Accepted):
{
  "job_id": "uuid",    // same as sent
  "status": "queued"
}

---

## 2. ApexCrawl → Apexverse: Callback Events

All callbacks: POST {callback_url}
Headers: X-Callback-Secret: {callback_secret}

### Event: job.started
{ "job_id": "uuid", "event": "job.started", "started_at": "ISO8601" }

### Event: job.progress  (send every ~10 pages)
{ "job_id": "uuid", "event": "job.progress", "pages_done": 42, "pages_total": 200, "current_url": "https://..." }

### Event: job.log  (send per page or on errors)
{ "job_id": "uuid", "event": "job.log", "level": "info|warn|error", "message": "Crawled https://...", "url": "https://...", "timestamp": "ISO8601" }

### Event: job.completed
{
  "job_id": "uuid",
  "event": "job.completed",
  "pages_processed": 1842,
  "pages_failed": 3,
  "chunks": 12405,
  "embeddings": 12405,
  "duration_ms": 192000,
  "output_file_url": "https://s3.../output.jsonl"  // optional
}

### Event: job.failed
{
  "job_id": "uuid",
  "event": "job.failed",
  "error_message": "Rate limited by target (429)",
  "pages_processed": 45,
  "duration_ms": 42000
}

---

## 3. Apexverse → ApexCrawl: Cancel Job

DELETE http://apexcrawl:8060/jobs/{job_id}

Response: { "ok": true }

---

## 4. ApexCrawl Health Check

GET http://apexcrawl:8060/health
Response: { "status": "ok" }

---

## 5. Minimal ApexCrawl FastAPI skeleton

from fastapi import FastAPI, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel
import httpx, asyncio

app = FastAPI()

class JobRequest(BaseModel):
    job_id: str
    target_url: str
    js_rendering: bool = False
    auto_chunking: bool = True
    chunk_size: int = 512
    chunk_overlap: int = 50
    embedding_provider: str = "none"
    embedding_api_key: str | None = None
    embedding_model: str | None = None
    vector_db: str = "none"
    vector_db_credentials: dict | None = None
    page_quota_remaining: int = 999999
    callback_url: str
    callback_secret: str

async def send_callback(url: str, secret: str, payload: dict):
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, json=payload, headers={"X-Callback-Secret": secret})

async def run_crawl(job: JobRequest):
    # 1. Send job.started
    await send_callback(job.callback_url, job.callback_secret, {
        "job_id": job.job_id, "event": "job.started",
        "started_at": datetime.utcnow().isoformat()
    })

    # 2. Your actual crawl logic here
    # ... crawl pages, chunk, embed, push to vector DB ...

    # 3. Send progress updates
    await send_callback(job.callback_url, job.callback_secret, {
        "job_id": job.job_id, "event": "job.progress",
        "pages_done": 50, "pages_total": 200
    })

    # 4. Send completion
    await send_callback(job.callback_url, job.callback_secret, {
        "job_id": job.job_id, "event": "job.completed",
        "pages_processed": 200, "pages_failed": 0,
        "chunks": 1400, "embeddings": 1400, "duration_ms": 45000
    })

@app.post("/jobs", status_code=202)
async def dispatch_job(job: JobRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_crawl, job)
    return {"job_id": job.job_id, "status": "queued"}

@app.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    # Set a flag to stop the crawl loop
    return {"ok": True}

@app.get("/health")
async def health():
    return {"status": "ok"}
