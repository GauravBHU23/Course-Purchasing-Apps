import uuid
from datetime import datetime, timezone
from pathlib import Path

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import APIRouter, Cookie, Depends, File, HTTPException, Request, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    create_verification_token,
    hash_password,
    verify_password,
    verify_reset_token_secret,
)
from app.db.session import get_db
from app.models.email_verification_token import EmailVerificationToken
from app.models.password_reset_token import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ProfileUpdateRequest,
    RegisterRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.cookies import clear_auth_cookies, set_auth_cookies
from app.services.email import (
    send_email_changed_email,
    send_password_changed_email,
    send_password_reset_email,
    send_verification_email,
    send_welcome_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])
password_hasher = PasswordHasher()


async def _issue_verification_email(db: AsyncSession, user: User) -> None:
    """Create a fresh verification token and email the link to the user."""
    settings = get_settings()
    token, token_id, token_hash, expires_at = create_verification_token()
    db.add(
        EmailVerificationToken(
            id=token_id, user_id=user.id, token_hash=token_hash, expires_at=expires_at
        )
    )
    await db.commit()
    verify_url = f"{settings.frontend_url.rstrip('/')}/verify-email?token={token}"
    send_verification_email(user.email, user.full_name, verify_url)


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    existing = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        if not existing.is_verified:
            try:
                await _issue_verification_email(db, existing)
            except Exception as exc:  # noqa: BLE001 - SMTP/network failures
                print(f"[EMAIL ERROR] Failed to resend verification email: {exc}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Account exists but we could not send the verification email right now. Please try again.",
                ) from exc
            return MessageResponse(
                message="This email is already registered but not verified. We sent a new verification email."
            )
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    try:
        await _issue_verification_email(db, user)
    except Exception as exc:  # noqa: BLE001 - SMTP/network failures
        print(f"[EMAIL ERROR] Failed to send verification email: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Account created but we could not send the verification email right now. Please try again.",
        ) from exc
    return MessageResponse(
        message="Account created. Please verify your email before logging in."
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request, payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    user = await db.scalar(select(User).where(User.email == payload.email.lower(), User.is_active.is_(True)))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox for the link.",
        )

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
    if not user.is_verified:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before accessing your account.",
        )

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


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    payload: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    now = datetime.now(timezone.utc)
    token_parts = payload.token.split(".", 1)
    if len(token_parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    token_id, token_secret = token_parts
    record = await db.scalar(
        select(EmailVerificationToken).where(EmailVerificationToken.id == token_id)
    )
    if not record or not verify_reset_token_secret(record.token_hash, token_secret):
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    user = await db.get(User, record.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    if user.is_verified:
        return MessageResponse(message="Your email is already verified. You can login now.")
    if record.used_at is not None or record.expires_at <= now:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    user.is_verified = True
    record.used_at = now
    await db.commit()

    settings = get_settings()
    login_url = f"{settings.frontend_url.rstrip('/')}/login"
    try:
        send_welcome_email(user.email, user.full_name, login_url)
    except Exception as exc:  # noqa: BLE001
        print(f"[EMAIL ERROR] welcome email failed: {exc}")

    return MessageResponse(message="Your email is verified. You can login now.")


@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("5/minute")
async def resend_verification(
    request: Request,
    payload: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    generic = MessageResponse(
        message="If that account exists and is not verified, a new link has been sent."
    )
    user = await db.scalar(
        select(User).where(User.email == payload.email.lower(), User.is_active.is_(True))
    )
    if not user or user.is_verified:
        return generic

    try:
        await _issue_verification_email(db, user)
    except Exception as exc:  # noqa: BLE001 - SMTP/network failures
        print(f"[EMAIL ERROR] Failed to resend verification email: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="We could not send the verification email right now. Please try again.",
        ) from exc
    return generic


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    payload: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)

    old_email = current_user.email
    email_changed = False
    new_email = updates.get("email")
    if new_email:
        new_email = new_email.lower()
        if new_email != current_user.email:
            existing = await db.scalar(select(User).where(User.email == new_email))
            if existing:
                raise HTTPException(status_code=409, detail="Email already in use")
            email_changed = True
        current_user.email = new_email

    if "full_name" in updates:
        current_user.full_name = updates["full_name"]
    if "avatar_color" in updates:
        current_user.avatar_color = updates["avatar_color"]

    await db.commit()
    await db.refresh(current_user)

    if email_changed:
        # Notify the PREVIOUS address so the original owner is alerted.
        try:
            send_email_changed_email(old_email, current_user.full_name, current_user.email)
        except Exception as exc:  # noqa: BLE001
            print(f"[EMAIL ERROR] email-changed alert failed: {exc}")

    return current_user


ALLOWED_AVATAR_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def _delete_old_avatar(avatar_url: str | None) -> None:
    settings = get_settings()
    if not avatar_url:
        return
    prefix = f"{settings.backend_url.rstrip('/')}/uploads/avatars/"
    if not avatar_url.startswith(prefix):
        return
    filename = avatar_url[len(prefix):]
    old_path = Path(settings.upload_dir) / "avatars" / filename
    try:
        if old_path.is_file():
            old_path.unlink()
    except OSError:
        pass


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    settings = get_settings()

    extension = ALLOWED_AVATAR_TYPES.get(file.content_type or "")
    if not extension:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP or GIF images are allowed")

    contents = await file.read()
    if len(contents) > settings.max_avatar_bytes:
        max_mb = settings.max_avatar_bytes // (1024 * 1024)
        raise HTTPException(status_code=400, detail=f"Image must be smaller than {max_mb} MB")

    avatars_dir = Path(settings.upload_dir) / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)

    _delete_old_avatar(current_user.avatar_url)

    filename = f"{current_user.id}_{uuid.uuid4().hex}{extension}"
    file_path = avatars_dir / filename
    file_path.write_bytes(contents)

    current_user.avatar_url = f"{settings.backend_url.rstrip('/')}/uploads/avatars/{filename}"
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/me/avatar", response_model=UserResponse)
async def remove_avatar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    _delete_old_avatar(current_user.avatar_url)
    current_user.avatar_url = None
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    payload: ChangePasswordRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(payload.new_password)

    # Revoke all refresh tokens so other sessions are signed out.
    tokens = await db.scalars(
        select(RefreshToken).where(
            RefreshToken.user_id == current_user.id, RefreshToken.revoked_at.is_(None)
        )
    )
    now = datetime.now(timezone.utc)
    for token in tokens:
        token.revoked_at = now

    await db.commit()
    clear_auth_cookies(response)

    try:
        send_password_changed_email(current_user.email, current_user.full_name)
    except Exception as exc:  # noqa: BLE001
        print(f"[EMAIL ERROR] password-changed alert failed: {exc}")

    return MessageResponse(message="Password changed successfully. Please sign in again.")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    settings = get_settings()

    user = await db.scalar(
        select(User).where(User.email == payload.email.lower(), User.is_active.is_(True))
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Your account does not exist. Please create an account.",
        )

    token, token_id, token_hash, expires_at = create_password_reset_token()
    db.add(
        PasswordResetToken(id=token_id, user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    )
    await db.commit()

    reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
    try:
        send_password_reset_email(user.email, user.full_name, reset_url)
    except Exception as exc:  # noqa: BLE001 - never leak SMTP errors to the client
        print(f"[EMAIL ERROR] Failed to send reset email: {exc}")

    return MessageResponse(message="Password reset link sent to your email.")


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    now = datetime.now(timezone.utc)
    token_parts = payload.token.split(".", 1)
    if len(token_parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    token_id, token_secret = token_parts
    reset_token = await db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.id == token_id,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
    )
    if not reset_token or not verify_reset_token_secret(reset_token.token_hash, token_secret):
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user = await db.get(User, reset_token.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user.hashed_password = hash_password(payload.new_password)
    reset_token.used_at = now

    # Revoke all refresh tokens for safety.
    tokens = await db.scalars(
        select(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
    )
    for token in tokens:
        token.revoked_at = now

    await db.commit()

    try:
        send_password_changed_email(user.email, user.full_name)
    except Exception as exc:  # noqa: BLE001
        print(f"[EMAIL ERROR] password-reset alert failed: {exc}")

    return MessageResponse(message="Password reset successfully. You can now sign in.")


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
