from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from cryptography.fernet import Fernet
import warnings
warnings.filterwarnings("ignore", ".*error reading bcrypt version.*")
warnings.filterwarnings("ignore", ".*trapped error reading bcrypt version.*")
from passlib.context import CryptContext
from app.config import settings
import base64
import hashlib
import secrets
import string

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password ─────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ──────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES)
    payload["type"] = "access"
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "jti": secrets.token_hex(16),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_REFRESH_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


# ── Fernet encryption for DB credentials / API keys ──────

def _get_fernet() -> Fernet:
    key_bytes = bytes.fromhex(settings.ENCRYPTION_KEY)
    # Fernet needs 32-byte base64-urlsafe key
    key = base64.urlsafe_b64encode(key_bytes[:32])
    return Fernet(key)


def encrypt_value(value: str) -> str:
    if not value:
        return value
    f = _get_fernet()
    return f.encrypt(value.encode()).decode()


def decrypt_value(encrypted: str) -> str:
    if not encrypted:
        return encrypted
    f = _get_fernet()
    return f.decrypt(encrypted.encode()).decode()


# ── API Key generation ────────────────────────────────────

def generate_api_key() -> tuple[str, str, str]:
    """Returns (full_key, prefix, hash)"""
    raw = secrets.token_urlsafe(32)
    full_key = f"apx_live_{raw}"
    prefix = full_key[:16] + "..."
    key_hash = pwd_context.hash(full_key)
    return full_key, prefix, key_hash


def verify_api_key(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── Email verification / password reset tokens ───────────

def create_email_token(email: str, purpose: str = "verify") -> str:
    payload = {
        "sub": email,
        "purpose": purpose,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_email_token(token: str, purpose: str = "verify") -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("purpose") != purpose:
            return None
        return payload.get("sub")
    except JWTError:
        return None


# ── Invite token ─────────────────────────────────────────

def generate_invite_token() -> str:
    return secrets.token_urlsafe(32)
