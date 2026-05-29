from datetime import datetime, timedelta, timezone
from uuid import uuid4

from argon2 import PasswordHasher
try:
    from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
except ImportError:
    # Older argon2-cffi releases expose slightly different exception names.
    from argon2.exceptions import InvalidHash as InvalidHashError
    from argon2.exceptions import VerifyMismatchError

    VerificationError = VerifyMismatchError
from jose import JWTError, jwt

from app.core.config import get_settings

password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return password_hasher.verify(hashed_password, password)
    except (InvalidHashError, VerificationError, VerifyMismatchError):
        return False


def create_access_token(subject: str, role: str) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "iss": settings.jwt_issuer,
        "sub": subject,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def create_refresh_token() -> tuple[str, str, str, datetime]:
    settings = get_settings()
    token_id = str(uuid4())
    token_secret = str(uuid4()) + str(uuid4())
    token = f"{token_id}.{token_secret}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days)
    return token, token_id, password_hasher.hash(token_secret), expires_at


def create_password_reset_token() -> tuple[str, str, str, datetime]:
    """Return (full_token, token_id, token_hash, expires_at)."""
    settings = get_settings()
    token_id = str(uuid4())
    token_secret = str(uuid4()) + str(uuid4())
    token = f"{token_id}.{token_secret}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.reset_token_minutes)
    return token, token_id, password_hasher.hash(token_secret), expires_at


def create_verification_token() -> tuple[str, str, str, datetime]:
    """Return (full_token, token_id, token_hash, expires_at) for email verification."""
    settings = get_settings()
    token_id = str(uuid4())
    token_secret = str(uuid4()) + str(uuid4())
    token = f"{token_id}.{token_secret}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.verify_token_hours)
    return token, token_id, password_hasher.hash(token_secret), expires_at


def verify_reset_token_secret(token_hash: str, token_secret: str) -> bool:
    try:
        return password_hasher.verify(token_hash, token_secret)
    except (InvalidHashError, VerificationError, VerifyMismatchError):
        return False


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            issuer=settings.jwt_issuer,
        )
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
    if payload.get("type") != "access":
        raise ValueError("Invalid token type")
    return payload
