import asyncio

from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.course import Course
from app.models.user import User

COURSES = [
    {
        "title": "Full Stack Mobile App Mastery",
        "slug": "full-stack-mobile-app-mastery",
        "description": "React Native, backend APIs, auth, payments, and app store deployment.",
        "price_cents": 499900,
        "level": "Intermediate",
        "duration_hours": 42,
        "thumbnail_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    },
    {
        "title": "Production FastAPI Backend",
        "slug": "production-fastapi-backend",
        "description": "FastAPI, PostgreSQL, JWT cookies, testing, Docker, and deployment.",
        "price_cents": 349900,
        "level": "Advanced",
        "duration_hours": 28,
        "thumbnail_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    },
    {
        "title": "Next.js TypeScript Frontend",
        "slug": "nextjs-typescript-frontend",
        "description": "App Router, typed API clients, secure auth flows, and polished UI.",
        "price_cents": 299900,
        "level": "Beginner",
        "duration_hours": 24,
        "thumbnail_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    },
]


async def seed() -> None:
    settings = get_settings()
    async with AsyncSessionLocal() as db:
        for item in COURSES:
            exists = await db.scalar(select(Course).where(Course.slug == item["slug"]))
            if not exists:
                db.add(Course(**item))
        admin = await db.scalar(select(User).where(User.email == settings.admin_email.lower()))
        if admin:
            admin.full_name = "CourseStack Admin"
            admin.hashed_password = hash_password(settings.admin_password)
            admin.role = "admin"
            admin.is_active = True
        else:
            db.add(
                User(
                    email=settings.admin_email.lower(),
                    full_name="CourseStack Admin",
                    hashed_password=hash_password(settings.admin_password),
                    role="admin",
                )
            )
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
