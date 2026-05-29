from fastapi import Response

from app.core.config import get_settings


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    settings = get_settings()
    cookie_options = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "domain": settings.cookie_domain,
    }
    response.set_cookie(
        "access_token",
        access_token,
        max_age=settings.access_token_minutes * 60,
        path="/",
        **cookie_options,
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        max_age=settings.refresh_token_days * 24 * 60 * 60,
        path="/api/v1/auth",
        **cookie_options,
    )


def clear_auth_cookies(response: Response) -> None:
    settings = get_settings()
    for name, path in (("access_token", "/"), ("refresh_token", "/api/v1/auth")):
        response.delete_cookie(
            name,
            path=path,
            domain=settings.cookie_domain,
            secure=settings.cookie_secure,
            httponly=True,
            samesite="lax",
        )

