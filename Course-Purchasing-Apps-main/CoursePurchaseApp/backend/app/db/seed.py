import asyncio
import sys
from pathlib import Path

from sqlalchemy import select

if __package__ in (None, ""):
    # Allow running this file directly via Code Runner / `python seed.py`.
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

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
    {
        "title": "React Dashboard Design System",
        "slug": "react-dashboard-design-system",
        "description": "Build scalable admin interfaces with reusable components, charts, tables, and form patterns.",
        "price_cents": 279900,
        "level": "Intermediate",
        "duration_hours": 20,
        "thumbnail_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    },
    {
        "title": "Node.js API Foundations",
        "slug": "nodejs-api-foundations",
        "description": "Learn REST APIs, Express, validation, authentication basics, and deployment-ready server structure.",
        "price_cents": 259900,
        "level": "Beginner",
        "duration_hours": 22,
        "thumbnail_url": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
    },
    {
        "title": "SQL and Database Performance",
        "slug": "sql-and-database-performance",
        "description": "Master joins, indexing, query optimization, schema planning, and production database tuning.",
        "price_cents": 319900,
        "level": "Intermediate",
        "duration_hours": 26,
        "thumbnail_url": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d",
    },
    {
        "title": "Docker and DevOps Essentials",
        "slug": "docker-and-devops-essentials",
        "description": "Containerize apps, write Dockerfiles, compose services, and automate deployment workflows.",
        "price_cents": 339900,
        "level": "Intermediate",
        "duration_hours": 25,
        "thumbnail_url": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9",
    },
    {
        "title": "Advanced React Patterns",
        "slug": "advanced-react-patterns",
        "description": "Level up with composition, state architecture, accessibility, transitions, and production React patterns.",
        "price_cents": 389900,
        "level": "Advanced",
        "duration_hours": 30,
        "thumbnail_url": "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
    },
    {
        "title": "Python Automation Bootcamp",
        "slug": "python-automation-bootcamp",
        "description": "Automate files, APIs, spreadsheets, emails, and daily workflows using modern Python tooling.",
        "price_cents": 229900,
        "level": "Beginner",
        "duration_hours": 18,
        "thumbnail_url": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935",
    },
    {
        "title": "Machine Learning Starter Projects",
        "slug": "machine-learning-starter-projects",
        "description": "Learn ML fundamentals through hands-on classification, regression, and deployment-ready mini projects.",
        "price_cents": 429900,
        "level": "Intermediate",
        "duration_hours": 34,
        "thumbnail_url": "https://images.unsplash.com/photo-1555949963-aa79dcee981c",
    },
    {
        "title": "System Design for Developers",
        "slug": "system-design-for-developers",
        "description": "Understand scalability, caching, queues, databases, and system tradeoffs with real architecture examples.",
        "price_cents": 459900,
        "level": "Advanced",
        "duration_hours": 32,
        "thumbnail_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
    },
    {
        "title": "UI UX for Product Builders",
        "slug": "ui-ux-for-product-builders",
        "description": "Design better user journeys, wireframes, prototypes, and polished interfaces for digital products.",
        "price_cents": 249900,
        "level": "Beginner",
        "duration_hours": 19,
        "thumbnail_url": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
    },
    {
        "title": "Firebase and Serverless Apps",
        "slug": "firebase-and-serverless-apps",
        "description": "Ship real-time apps with Firebase auth, Firestore, cloud functions, hosting, and notifications.",
        "price_cents": 309900,
        "level": "Intermediate",
        "duration_hours": 23,
        "thumbnail_url": "https://images.unsplash.com/photo-1516321497487-e288fb19713f",
    },
    {
        "title": "Cybersecurity Basics for Engineers",
        "slug": "cybersecurity-basics-for-engineers",
        "description": "Learn practical security hygiene, auth risks, OWASP basics, and secure coding for modern apps.",
        "price_cents": 289900,
        "level": "Beginner",
        "duration_hours": 21,
        "thumbnail_url": "https://images.unsplash.com/photo-1563013544-824ae1b704d3",
    },
]


async def seed() -> None:
    settings = get_settings()
    async with AsyncSessionLocal() as db:
        for item in COURSES:
            course = await db.scalar(select(Course).where(Course.slug == item["slug"]))
            if course:
                course.title = item["title"]
                course.description = item["description"]
                course.price_cents = item["price_cents"]
                course.level = item["level"]
                course.duration_hours = item["duration_hours"]
                course.thumbnail_url = item["thumbnail_url"]
            else:
                db.add(Course(**item))
        admin = await db.scalar(select(User).where(User.email == settings.admin_email.lower()))
        if admin:
            admin.full_name = "CourseStack Admin"
            admin.hashed_password = hash_password(settings.admin_password)
            admin.role = "admin"
            admin.is_active = True
            admin.is_verified = True
        else:
            db.add(
                User(
                    email=settings.admin_email.lower(),
                    full_name="CourseStack Admin",
                    hashed_password=hash_password(settings.admin_password),
                    role="admin",
                    is_verified=True,
                )
            )
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
