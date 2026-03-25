from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.database import get_db
from app.models import (
    User, Project, Run, Subscription, Notification, TeamMember, ApiKey,
    RunStatusEnum, ProjectStatusEnum, NotifTypeEnum, TeamRoleEnum, TeamStatusEnum
)
from app.middleware.auth import get_current_user, get_current_active_subscriber
from app.utils.auth import hash_password, verify_password, generate_api_key, generate_invite_token
from app.services.email import send_team_invite_email
import uuid

# ── Dashboard ─────────────────────────────────────────────
dashboard_router = APIRouter()

@dashboard_router.get("")
async def get_dashboard(
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()

    proj_result = await db.execute(
        select(func.count(Project.id)).where(Project.user_id == user.id, Project.status != ProjectStatusEnum.archived)
    )
    active_projects = proj_result.scalar() or 0

    # Projects near limit (>80% of quota used... per project we track pages_processed vs no per-project limit, just show active ones)
    runs_result = await db.execute(
        select(Run).where(Run.user_id == user.id).order_by(Run.created_at.desc()).limit(10)
    )
    recent_runs = runs_result.scalars().all()

    # Average extraction time
    avg_result = await db.execute(
        select(func.avg(Run.duration_ms)).where(Run.user_id == user.id, Run.status == RunStatusEnum.completed)
    )
    avg_ms = avg_result.scalar() or 0

    return {
        "pages_used": sub.pages_used_this_period if sub else 0,
        "page_quota": sub.page_quota if sub else 1000,
        "usage_pct": round((sub.pages_used_this_period / sub.page_quota) * 100, 1) if sub and sub.page_quota else 0,
        "active_projects": active_projects,
        "avg_extraction_time_ms": int(avg_ms),
        "plan": sub.plan if sub else None,
        "recent_runs": [
            {
                "id": str(r.id),
                "project_id": str(r.project_id),
                "status": r.status,
                "pages_processed": r.pages_processed,
                "duration_ms": r.duration_ms,
                "finished_at": r.finished_at.isoformat() if r.finished_at else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recent_runs
        ],
    }


# ── Analytics ─────────────────────────────────────────────
analytics_router = APIRouter()

@analytics_router.get("")
async def get_analytics(
    range: str = "7d",
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    days = {"24h": 1, "7d": 7, "30d": 30}.get(range, 7)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    runs_result = await db.execute(
        select(Run).where(Run.user_id == user.id, Run.created_at >= since)
    )
    runs = runs_result.scalars().all()

    total_pages = sum(r.pages_processed for r in runs)
    total_ms = sum(r.duration_ms or 0 for r in runs)
    completed = [r for r in runs if r.status == RunStatusEnum.completed]
    failed = [r for r in runs if r.status == RunStatusEnum.failed]
    success_rate = len(completed) / len(runs) if runs else 1.0

    # Chart data — group by day
    chart = {}
    for r in runs:
        day = r.created_at.strftime("%Y-%m-%d") if r.created_at else "unknown"
        chart[day] = chart.get(day, 0) + r.pages_processed

    chart_data = [{"date": k, "pages": v} for k, v in sorted(chart.items())]

    return {
        "pages_extracted": total_pages,
        "compute_time_ms": total_ms,
        "success_rate": round(success_rate, 3),
        "total_runs": len(runs),
        "failed_runs": len(failed),
        "chart": chart_data,
    }


@analytics_router.get("/runs")
async def get_run_history(
    page: int = 1,
    size: int = 20,
    status: Optional[str] = None,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    query = select(Run).where(Run.user_id == user.id)
    if status:
        query = query.where(Run.status == status)
    query = query.order_by(Run.created_at.desc()).offset((page - 1) * size).limit(size)

    result = await db.execute(query)
    runs = result.scalars().all()

    count_result = await db.execute(select(func.count(Run.id)).where(Run.user_id == user.id))
    total = count_result.scalar() or 0

    return {
        "total": total,
        "page": page,
        "size": size,
        "runs": [
            {
                "id": str(r.id),
                "project_id": str(r.project_id),
                "trigger": r.trigger,
                "status": r.status,
                "pages_processed": r.pages_processed,
                "duration_ms": r.duration_ms,
                "error_message": r.error_message,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "finished_at": r.finished_at.isoformat() if r.finished_at else None,
            }
            for r in runs
        ],
    }


# ── Notifications ─────────────────────────────────────────
notifications_router = APIRouter()

@notifications_router.get("")
async def list_notifications(
    page: int = 1, size: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * size).limit(size)
    )
    notifs = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "read": n.read,
            "link": n.link,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]


@notifications_router.get("/unread-count")
async def unread_count(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(func.count(Notification.id)).where(Notification.user_id == user.id, Notification.read == False)
    )
    return {"count": result.scalar() or 0}


class MarkReadRequest(BaseModel):
    ids: list[str]

@notifications_router.post("/mark-read")
async def mark_read(body: MarkReadRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == user.id, Notification.id.in_(body.ids))
    )
    for n in result.scalars().all():
        n.read = True
    await db.commit()
    return {"ok": True}


@notifications_router.post("/mark-all-read")
async def mark_all_read(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.user_id == user.id, Notification.read == False))
    for n in result.scalars().all():
        n.read = True
    await db.commit()
    return {"ok": True}


@notifications_router.delete("/{notif_id}")
async def delete_notification(notif_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.id == notif_id, Notification.user_id == user.id))
    n = result.scalar_one_or_none()
    if not n:
        raise HTTPException(status_code=404)
    await db.delete(n)
    await db.commit()
    return {"ok": True}


# ── Team ──────────────────────────────────────────────────
team_router = APIRouter()

class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "member"

class UpdateMemberRequest(BaseModel):
    role: str

@team_router.get("")
async def list_team(user: User = Depends(get_current_active_subscriber), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TeamMember).where(TeamMember.workspace_id == user.id))
    members = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "email": m.email,
            "role": m.role,
            "status": m.status,
            "invited_at": m.invited_at.isoformat() if m.invited_at else None,
            "accepted_at": m.accepted_at.isoformat() if m.accepted_at else None,
        }
        for m in members
    ]

@team_router.post("/invite")
async def invite_member(
    body: InviteRequest,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    token = generate_invite_token()
    member = TeamMember(
        id=uuid.uuid4(),
        workspace_id=user.id,
        email=body.email,
        role=body.role,
        status=TeamStatusEnum.invited,
        invite_token=token,
    )
    db.add(member)
    await db.commit()
    await send_team_invite_email(body.email, user.name or "Someone", token)
    return {"ok": True}

@team_router.patch("/{member_id}")
async def update_member(
    member_id: str, body: UpdateMemberRequest,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TeamMember).where(TeamMember.id == member_id, TeamMember.workspace_id == user.id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404)
    member.role = body.role
    await db.commit()
    return {"ok": True}

@team_router.delete("/{member_id}")
async def remove_member(
    member_id: str,
    user: User = Depends(get_current_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TeamMember).where(TeamMember.id == member_id, TeamMember.workspace_id == user.id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404)
    await db.delete(member)
    await db.commit()
    return {"ok": True}

@team_router.post("/accept/{token}")
async def accept_invite(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TeamMember).where(TeamMember.invite_token == token))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Invalid invite link")
    member.status = TeamStatusEnum.active
    member.accepted_at = datetime.now(timezone.utc)
    member.invite_token = None
    await db.commit()
    return {"ok": True, "email": member.email}


# ── Settings ──────────────────────────────────────────────
settings_router = APIRouter()

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@settings_router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "company": user.company,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "email_verified": user.email_verified,
    }

@settings_router.patch("/profile")
async def update_profile(body: ProfileUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.commit()
    return {"ok": True}

@settings_router.post("/change-password")
async def change_password(body: PasswordChange, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not user.password_hash or not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"ok": True}

@settings_router.get("/api-keys")
async def list_api_keys(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user.id, ApiKey.revoked_at == None)
    )
    keys = result.scalars().all()
    return [
        {
            "id": str(k.id),
            "name": k.name,
            "prefix": k.key_prefix,
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
            "created_at": k.created_at.isoformat() if k.created_at else None,
        }
        for k in keys
    ]

@settings_router.post("/api-keys")
async def create_api_key(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    full_key, prefix, key_hash = generate_api_key()
    api_key = ApiKey(id=uuid.uuid4(), user_id=user.id, key_prefix=prefix, key_hash=key_hash)
    db.add(api_key)
    await db.commit()
    # Return full key ONCE
    return {"id": str(api_key.id), "key": full_key, "prefix": prefix, "message": "Store this key securely. It will not be shown again."}

@settings_router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user.id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404)
    key.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}
