from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models import (
    User, Project, Run, RunLog, Subscription, Notification,
    ProjectStatusEnum, RunStatusEnum, RunTriggerEnum, NotifTypeEnum,
    VectorDBEnum, EmbeddingProviderEnum
)
from app.middleware.auth import get_current_active_subscriber
from app.utils.auth import encrypt_value, decrypt_value
from app.config import settings
import uuid
import json
import asyncio
import httpx
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Schemas ───────────────────────────────────────────────

class SeedUrl(BaseModel):
    url: str
    depth: int = 3

class ProjectCreate(BaseModel):
    name: str
    target_url: str
    seed_urls: Optional[list] = None
    crawl_depth: int = 3
    url_patterns_include: Optional[str] = None
    url_patterns_exclude: Optional[str] = None
    js_rendering: bool = False
    auto_chunking: bool = True
    chunk_size: int = 512
    chunk_overlap: int = 50
    vector_db: str = "none"
    vector_db_credentials: Optional[dict] = None
    embedding_provider: str = "none"
    embedding_api_key: Optional[str] = None
    embedding_model: Optional[str] = None
    schedule_cron: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    target_url: Optional[str] = None
    seed_urls: Optional[list] = None
    crawl_depth: Optional[int] = None
    url_patterns_include: Optional[str] = None
    url_patterns_exclude: Optional[str] = None
    js_rendering: Optional[bool] = None
    auto_chunking: Optional[bool] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    vector_db: Optional[str] = None
    vector_db_credentials: Optional[dict] = None
    embedding_provider: Optional[str] = None
    embedding_api_key: Optional[str] = None
    embedding_model: Optional[str] = None
    schedule_cron: Optional[str] = None
    status: Optional[str] = None


def _project_dict(p: Project) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "target_url": p.target_url,
        "seed_urls": p.seed_urls or [],
        "crawl_depth": p.crawl_depth,
        "url_patterns_include": p.url_patterns_include,
        "url_patterns_exclude": p.url_patterns_exclude,
        "status": p.status,
        "js_rendering": p.js_rendering,
        "auto_chunking": p.auto_chunking,
        "chunk_size": p.chunk_size,
        "chunk_overlap": p.chunk_overlap,
        "vector_db": p.vector_db,
        "embedding_provider": p.embedding_provider,
        "embedding_model": p.embedding_model,
        "schedule_cron": p.schedule_cron,
        "pages_processed": p.pages_processed,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _run_dict(r: Run) -> dict:
    return {
        "id": str(r.id),
        "project_id": str(r.project_id),
        "trigger": r.trigger,
        "status": r.status,
        "pages_processed": r.pages_processed,
        "pages_failed": r.pages_failed,
        "chunks_created": r.chunks_created,
        "embeddings_created": r.embeddings_created,
        "error_message": r.error_message,
        "started_at": r.started_at.isoformat() if r.started_at else None,
        "finished_at": r.finished_at.isoformat() if r.finished_at else None,
        "duration_ms": r.duration_ms,
        "output_file_url": r.output_file_url,
        "scraper_job_id": r.scraper_job_id,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


# ── Projects CRUD ─────────────────────────────────────────

@router.get("")
async def list_projects(
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .where(Project.user_id == user.id, Project.status != ProjectStatusEnum.archived)
        .order_by(Project.created_at.desc())
    )
    return [_project_dict(p) for p in result.scalars().all()]


@router.post("")
async def create_project(
    body: ProjectCreate,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    # Check plan project limit
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()
    limit = settings.PLAN_QUOTAS.get(sub.plan if sub else "starter", {}).get("projects", 2)

    count_result = await db.execute(
        select(func.count(Project.id)).where(
            Project.user_id == user.id, Project.status != ProjectStatusEnum.archived
        )
    )
    if (count_result.scalar() or 0) >= limit:
        raise HTTPException(
            status_code=403,
            detail=f"Project limit ({limit}) reached for your plan. Upgrade to create more."
        )

    vdb_creds = None
    if body.vector_db_credentials:
        vdb_creds = {k: encrypt_value(str(v)) for k, v in body.vector_db_credentials.items()}

    emb_key = encrypt_value(body.embedding_api_key) if body.embedding_api_key else None

    seed_urls = body.seed_urls
    if not seed_urls:
        seed_urls = [{"url": body.target_url, "depth": body.crawl_depth}]

    project = Project(
        id=uuid.uuid4(),
        user_id=user.id,
        name=body.name,
        target_url=body.target_url,
        seed_urls=seed_urls,
        crawl_depth=body.crawl_depth,
        url_patterns_include=body.url_patterns_include,
        url_patterns_exclude=body.url_patterns_exclude,
        js_rendering=body.js_rendering,
        auto_chunking=body.auto_chunking,
        chunk_size=body.chunk_size,
        chunk_overlap=body.chunk_overlap,
        vector_db=body.vector_db,
        vector_db_credentials=vdb_creds,
        embedding_provider=body.embedding_provider,
        embedding_api_key=emb_key,
        embedding_model=body.embedding_model,
        schedule_cron=body.schedule_cron,
    )
    db.add(project)
    await db.commit()
    return _project_dict(project)


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    runs_result = await db.execute(
        select(Run).where(Run.project_id == project_id)
        .order_by(Run.created_at.desc()).limit(10)
    )
    data = _project_dict(project)
    data["recent_runs"] = [_run_dict(r) for r in runs_result.scalars().all()]
    return data


@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in body.model_dump(exclude_none=True).items():
        if field == "vector_db_credentials" and value:
            value = {k: encrypt_value(str(v)) for k, v in value.items()}
        if field == "embedding_api_key" and value:
            value = encrypt_value(value)
        setattr(project, field, value)

    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return _project_dict(project)


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = ProjectStatusEnum.archived
    await db.commit()
    return {"ok": True}


# ── Runs ──────────────────────────────────────────────────

@router.get("/{project_id}/runs")
async def list_runs(
    project_id: str,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    proj_result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(Run).where(Run.project_id == project_id)
        .order_by(Run.created_at.desc()).limit(50)
    )
    return [_run_dict(r) for r in result.scalars().all()]


@router.post("/{project_id}/run")
async def trigger_run(
    project_id: str,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    proj_result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Block if already running
    active_result = await db.execute(
        select(Run).where(
            Run.project_id == project_id,
            Run.status.in_([RunStatusEnum.queued, RunStatusEnum.running])
        )
    )
    if active_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A run is already in progress for this project")

    # Check quota
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()
    if sub and sub.pages_used_this_period >= sub.page_quota:
        raise HTTPException(status_code=403, detail="Monthly page quota exhausted. Upgrade or wait for reset.")

    run = Run(
        id=uuid.uuid4(),
        project_id=project_id,
        user_id=user.id,
        trigger=RunTriggerEnum.manual,
        status=RunStatusEnum.queued,
    )
    db.add(run)
    await db.flush()

    error_msg = None
    try:
        await _dispatch_to_apexcrawl(project, run, sub)
        run.status = RunStatusEnum.running
        run.started_at = datetime.now(timezone.utc)
        logger.info(f"Run {run.id} dispatched to ApexCrawl for project {project.name}")
    except httpx.ConnectError:
        logger.error(f"ApexCrawl not reachable at {settings.SCRAPER_SERVICE_URL}")
        run.status = RunStatusEnum.failed
        run.error_message = "Crawl service unavailable"
    except httpx.HTTPStatusError as e:
        logger.error(f"ApexCrawl rejected job: {e.response.status_code} {e.response.text[:200]}")
        run.status = RunStatusEnum.failed
        run.error_message = "Crawl service returned an error"
    except Exception as e:
        logger.error(f"Dispatch error: {str(e)}")
        run.status = RunStatusEnum.failed
        run.error_message = "Failed to start crawl"

    await db.commit()

    if run.status == RunStatusEnum.failed:
        raise HTTPException(
            status_code=503,
            detail={"code": "crawl_service_unavailable", "message": "The crawl service is temporarily unavailable. Please try again in a moment."}
        )

    return _run_dict(run)


async def _dispatch_to_apexcrawl(project: Project, run: Run, sub):
    """
    Dispatch a crawl job to ApexCrawl.

    ApexCrawl expects:
    POST /jobs  →  { job_id, seed_urls, crawl_config, callback_url, callback_secret }

    Each seed_url has { url, depth } so ApexCrawl crawls each independently.
    For now embedding/vector DB fields are sent as null — will be connected later.
    """
    seed_urls = project.seed_urls
    if not seed_urls:
        seed_urls = [{"url": project.target_url, "depth": project.crawl_depth or 3}]

    # Normalize depths — 99 means unlimited (map to large number ApexCrawl understands)
    normalized_seeds = []
    for s in seed_urls:
        depth = s.get("depth", 3)
        if depth == 99:
            depth = 100  # ApexCrawl treats this as unlimited
        normalized_seeds.append({"url": s["url"], "depth": depth})

    payload = {
        "job_id": str(run.id),
        # Seed URLs with per-URL depth control
        "seed_urls": normalized_seeds,
        # Use first URL as primary (for backwards compat with ApexCrawl)
        "target_url": normalized_seeds[0]["url"] if normalized_seeds else project.target_url,
        # Crawl config
        "js_rendering": project.js_rendering,
        "auto_chunking": project.auto_chunking,
        "chunk_size": project.chunk_size or 512,
        "chunk_overlap": project.chunk_overlap or 50,
        # URL filters
        "url_patterns_include": project.url_patterns_include,
        "url_patterns_exclude": project.url_patterns_exclude,
        # Quota enforcement
        "page_quota_remaining": max(0, (sub.page_quota - sub.pages_used_this_period)) if sub else 999999,
        # Embedding/vector DB — not connected yet, send null
        "embedding_provider": "none",
        "embedding_api_key": None,
        "embedding_model": None,
        "vector_db": "none",
        "vector_db_credentials": None,
        # Callback so ApexCrawl can report progress back
        "callback_url": f"{settings.BACKEND_URL}/projects/scraper-callback",
        "callback_secret": settings.SCRAPER_WEBHOOK_SECRET,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{settings.SCRAPER_SERVICE_URL}/jobs",
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        run.scraper_job_id = data.get("job_id", str(run.id))
        logger.info(f"ApexCrawl accepted job {run.scraper_job_id}")


@router.post("/{project_id}/cancel")
async def cancel_run(
    project_id: str,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Run).where(
            Run.project_id == project_id,
            Run.status.in_([RunStatusEnum.queued, RunStatusEnum.running])
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="No active run to cancel")

    # Tell ApexCrawl to stop
    if run.scraper_job_id:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.delete(f"{settings.SCRAPER_SERVICE_URL}/jobs/{run.scraper_job_id}")
        except Exception:
            pass  # Best effort — still mark as canceled in DB

    run.status = RunStatusEnum.canceled
    run.finished_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}


@router.get("/{project_id}/runs/{run_id}")
async def get_run(
    project_id: str, run_id: str,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Run).where(Run.id == run_id, Run.project_id == project_id, Run.user_id == user.id)
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return _run_dict(run)


@router.get("/{project_id}/runs/{run_id}/logs")
async def get_run_logs(
    project_id: str, run_id: str,
    page: int = 1, size: int = 100,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RunLog).where(RunLog.run_id == run_id)
        .order_by(RunLog.created_at.asc())
        .offset((page - 1) * size).limit(size)
    )
    return [
        {
            "id": str(l.id),
            "level": l.level,
            "message": l.message,
            "url": l.url,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in result.scalars().all()
    ]


@router.get("/{project_id}/runs/{run_id}/logs/stream")
async def stream_run_logs(
    project_id: str, run_id: str,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Server-Sent Events — streams live logs from DB as ApexCrawl fires callbacks."""
    async def event_generator():
        last_id = None
        while True:
            query = select(RunLog).where(RunLog.run_id == run_id)
            if last_id:
                query = query.where(RunLog.id > last_id)
            query = query.order_by(RunLog.created_at.asc()).limit(50)

            result = await db.execute(query)
            logs = result.scalars().all()

            for log in logs:
                last_id = log.id
                data = json.dumps({
                    "level": log.level,
                    "message": log.message,
                    "url": log.url,
                    "timestamp": log.created_at.isoformat() if log.created_at else None,
                })
                yield f"event: log\ndata: {data}\n\n"

            # Stop streaming when run is done
            run_result = await db.execute(select(Run).where(Run.id == run_id))
            run = run_result.scalar_one_or_none()
            if run and run.status in [RunStatusEnum.completed, RunStatusEnum.failed, RunStatusEnum.canceled]:
                yield f"event: {run.status}\ndata: {{}}\n\n"
                break

            await asyncio.sleep(1.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── Scraper Callback (ApexCrawl → Apexverse) ─────────────

@router.post("/scraper-callback")
async def scraper_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    ApexCrawl calls this endpoint as the crawl progresses.
    Events: job.started | job.progress | job.log | job.completed | job.failed
    """
    # Verify shared secret
    secret = request.headers.get("X-Callback-Secret", "")
    if secret != settings.SCRAPER_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid callback secret")

    body = await request.json()
    job_id  = body.get("job_id")
    event   = body.get("event")

    if not job_id:
        return {"ok": True}

    run_result = await db.execute(select(Run).where(Run.id == job_id))
    run = run_result.scalar_one_or_none()
    if not run:
        logger.warning(f"Callback for unknown job_id: {job_id}")
        return {"ok": True}

    if event == "job.started":
        run.status = RunStatusEnum.running
        run.started_at = datetime.now(timezone.utc)
        log = RunLog(id=uuid.uuid4(), run_id=run.id, level="info",
                     message=f"Crawl started by ApexCrawl")
        db.add(log)

    elif event == "job.progress":
        pages_done = body.get("pages_done", 0)
        run.pages_processed = pages_done
        current_url = body.get("current_url", "")
        log = RunLog(id=uuid.uuid4(), run_id=run.id, level="info",
                     message=f"Progress: {pages_done} pages crawled",
                     url=current_url or None)
        db.add(log)

    elif event == "job.log":
        log = RunLog(
            id=uuid.uuid4(),
            run_id=run.id,
            level=body.get("level", "info"),
            message=body.get("message", ""),
            url=body.get("url"),
        )
        db.add(log)

    elif event == "job.completed":
        pages_processed = body.get("pages_processed", 0)
        pages_failed    = body.get("pages_failed", 0)
        chunks          = body.get("chunks", 0)
        duration_ms     = body.get("duration_ms", 0)
        output_url      = body.get("output_file_url")

        run.status           = RunStatusEnum.completed
        run.pages_processed  = pages_processed
        run.pages_failed     = pages_failed
        run.chunks_created   = chunks
        run.duration_ms      = duration_ms
        run.output_file_url  = output_url
        run.finished_at      = datetime.now(timezone.utc)

        log = RunLog(id=uuid.uuid4(), run_id=run.id, level="info",
                     message=f"Completed: {pages_processed} pages, {chunks} chunks, {duration_ms}ms")
        db.add(log)

        # Update project total page count
        proj_result = await db.execute(select(Project).where(Project.id == run.project_id))
        project = proj_result.scalar_one_or_none()
        if project:
            project.pages_processed = (project.pages_processed or 0) + pages_processed
            project.updated_at = datetime.now(timezone.utc)

        # Update subscription usage
        sub_result = await db.execute(select(Subscription).where(Subscription.user_id == run.user_id))
        sub = sub_result.scalar_one_or_none()
        if sub:
            sub.pages_used_this_period = (sub.pages_used_this_period or 0) + pages_processed
            usage_pct = (sub.pages_used_this_period / sub.page_quota) * 100 if sub.page_quota else 0

            # Quota warning notifications
            if usage_pct >= 100:
                db.add(Notification(
                    id=uuid.uuid4(), user_id=run.user_id,
                    type=NotifTypeEnum.quota_warning,
                    title="Page quota exhausted",
                    body="You've used 100% of your monthly quota. Upgrade to continue crawling.",
                    link="/billing"
                ))
            elif usage_pct >= 80:
                db.add(Notification(
                    id=uuid.uuid4(), user_id=run.user_id,
                    type=NotifTypeEnum.quota_warning,
                    title="Approaching page limit",
                    body=f"You've used {usage_pct:.0f}% of your monthly quota ({sub.pages_used_this_period:,} / {sub.page_quota:,} pages).",
                    link="/billing"
                ))

        # Success notification
        db.add(Notification(
            id=uuid.uuid4(), user_id=run.user_id,
            type=NotifTypeEnum.run_complete,
            title="Crawl completed",
            body=f"{pages_processed:,} pages, {chunks:,} chunks extracted{' — download ready' if output_url else ''}",
            link=f"/projects/{run.project_id}"
        ))

    elif event == "job.failed":
        error_msg       = body.get("error_message", "Unknown error")
        pages_processed = body.get("pages_processed", 0)
        duration_ms     = body.get("duration_ms", 0)

        run.status          = RunStatusEnum.failed
        run.error_message   = error_msg
        run.pages_processed = pages_processed
        run.duration_ms     = duration_ms
        run.finished_at     = datetime.now(timezone.utc)

        log = RunLog(id=uuid.uuid4(), run_id=run.id, level="error",
                     message=f"Crawl failed: {error_msg}")
        db.add(log)

        db.add(Notification(
            id=uuid.uuid4(), user_id=run.user_id,
            type=NotifTypeEnum.run_failed,
            title="Crawl failed",
            body=error_msg[:200],
            link=f"/projects/{run.project_id}"
        ))

    await db.commit()
    return {"ok": True}
