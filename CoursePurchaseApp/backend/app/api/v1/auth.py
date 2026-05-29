from datetime import datetime, timezone

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.db.session import get_db
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.cookies import clear_auth_cookies, set_auth_cookies

router = APIRouter(prefix="/auth", tags=["auth"])
password_hasher = PasswordHasher()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> User:
    existing = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user = await db.scalar(select(User).where(User.email == payload.email.lower(), User.is_active.is_(True)))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(user.id, user.role)
    refresh_token, token_id, token_hash, expires_at = create_refresh_token()
    db.add(RefreshToken(id=token_id, user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    await db.commit()
    set_auth_cookies(response, access_token, refresh_token)
    return TokenResponse(access_token=access_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    now = datetime.now(timezone.utc)
    token_parts = refresh_token.split(".", 1)
    if len(token_parts) != 2:
        clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    token_id, token_secret = token_parts
    matched_token = await db.scalar(
        select(RefreshToken).where(
            RefreshToken.id == token_id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > now,
        )
    )
    try:
        token_valid = bool(matched_token and password_hasher.verify(matched_token.token_hash, token_secret))
    except (InvalidHashError, VerificationError, VerifyMismatchError):
        token_valid = False

    if not token_valid or not matched_token:
        clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = await db.get(User, matched_token.user_id)
    if not user or not user.is_active:
        clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active")

    matched_token.revoked_at = now
    new_refresh, new_id, new_hash, expires_at = create_refresh_token()
    access_token = create_access_token(user.id, user.role)
    db.add(RefreshToken(id=new_id, user_id=user.id, token_hash=new_hash, expires_at=expires_at))
    await db.commit()
    set_auth_cookies(response, access_token, new_refresh)
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> None:
    if refresh_token:
        token_parts = refresh_token.split(".", 1)
        if len(token_parts) == 2:
            token_id, token_secret = token_parts
            stored_token = await db.scalar(
                select(RefreshToken).where(RefreshToken.id == token_id, RefreshToken.revoked_at.is_(None))
            )
            try:
                if stored_token and password_hasher.verify(stored_token.token_hash, token_secret):
                    stored_token.revoked_at = datetime.now(timezone.utc)
            except (InvalidHashError, VerificationError, VerifyMismatchError):
                pass
            await db.commit()
    clear_auth_cookies(response)
