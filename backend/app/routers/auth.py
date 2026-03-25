from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models import User, Subscription, SubStatusEnum, PlanEnum, CycleEnum
from app.utils.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_refresh_token,
    create_email_token, decode_email_token
)
from app.middleware.auth import get_current_user
from app.services.email import send_verification_email, send_password_reset_email
from app.config import settings
import httpx
import uuid

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    company: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotRequest(BaseModel):
    email: EmailStr


class ResetRequest(BaseModel):
    token: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Helpers ───────────────────────────────────────────────

def _user_dict(user: User, sub: Subscription | None = None) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "company": user.company,
        "avatar_url": user.avatar_url,
        "email_verified": user.email_verified,
        "plan": sub.plan if sub else None,
        "subscription_status": sub.status if sub else None,
    }


def _make_tokens(user: User, sub: Subscription | None = None) -> dict:
    access = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "plan": sub.plan if sub else None,
        "subscription_status": sub.status if sub else None,
    })
    refresh = create_refresh_token(str(user.id))
    return {"access_token": access, "refresh_token": refresh}


# ── Endpoints ─────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check existing
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=uuid.uuid4(),
        email=body.email,
        name=body.name,
        company=body.company,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.flush()

    # Send verification email
    token = create_email_token(body.email, "verify")
    await send_verification_email(body.email, body.name or "there", token)

    await db.commit()
    tokens = _make_tokens(user)
    return {**tokens, "user": _user_dict(user)}


@router.post("/login")
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Get subscription
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()

    tokens = _make_tokens(user, sub)

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.JWT_REFRESH_EXPIRE_DAYS * 86400,
    )

    return {
        "access_token": tokens["access_token"],
        "token_type": "bearer",
        "user": _user_dict(user, sub),
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"ok": True}


@router.post("/refresh")
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_refresh_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()

    tokens = _make_tokens(user, sub)
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.JWT_REFRESH_EXPIRE_DAYS * 86400,
    )
    return {"access_token": tokens["access_token"], "token_type": "bearer"}


@router.get("/me")
async def me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()
    return _user_dict(user, sub)


@router.post("/forgot-password")
async def forgot_password(body: ForgotRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user:
        token = create_email_token(body.email, "reset")
        await send_password_reset_email(body.email, user.name or "there", token)
    # Always return success (don't reveal if email exists)
    return {"ok": True, "message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(body: ResetRequest, db: AsyncSession = Depends(get_db)):
    email = decode_email_token(body.token, "reset")
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(body.password)
    await db.commit()
    return {"ok": True}


@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    email = decode_email_token(token, "verify")
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired link")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.email_verified = True
    await db.commit()
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?verified=true")


# ── Google OAuth ──────────────────────────────────────────

@router.get("/google")
async def google_oauth():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    from urllib.parse import urlencode
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url=url)


@router.get("/google/callback")
async def google_callback(code: str, response: Response, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_res = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
        token_data = token_res.json()
        if "error" in token_data:
            raise HTTPException(status_code=400, detail="Google OAuth failed")

        # Get user info
        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        info = user_info_res.json()

    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email from Google")

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email,
            name=info.get("name"),
            google_id=info.get("id"),
            avatar_url=info.get("picture"),
            email_verified=True,
        )
        db.add(user)
        await db.flush()
    else:
        if not user.google_id:
            user.google_id = info.get("id")
        user.email_verified = True

    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()

    tokens = _make_tokens(user, sub)
    await db.commit()

    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.JWT_REFRESH_EXPIRE_DAYS * 86400,
    )

    # Redirect to frontend with access token
    redirect_url = f"{settings.FRONTEND_URL}/checkout?token={tokens['access_token']}"
    return RedirectResponse(url=redirect_url)
