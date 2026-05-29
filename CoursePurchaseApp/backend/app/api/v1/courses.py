from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_admin_user, get_current_user
from app.db.session import get_db
from app.models.course import Course
from app.models.purchase import Purchase
from app.models.user import User
from app.schemas.course import CourseCreateRequest, CourseResponse, CourseUpdateRequest, PurchaseResponse

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=list[CourseResponse])
async def list_courses(db: AsyncSession = Depends(get_db)) -> list[Course]:
    return list(await db.scalars(select(Course).order_by(Course.created_at.desc())))


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> Course:
    existing = await db.scalar(select(Course).where(Course.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=409, detail="Course slug already exists")
    course = Course(**payload.model_dump())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    payload: CourseUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> Course:
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    updates = payload.model_dump(exclude_unset=True)
    if "slug" in updates:
        existing = await db.scalar(select(Course).where(Course.slug == updates["slug"], Course.id != course_id))
        if existing:
            raise HTTPException(status_code=409, detail="Course slug already exists")

    for key, value in updates.items():
        setattr(course, key, value)
    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> None:
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(course)
    await db.commit()


@router.post("/{course_id}/purchase", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
async def purchase_course(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Purchase:
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = await db.scalar(
        select(Purchase)
        .options(selectinload(Purchase.course))
        .where(Purchase.user_id == current_user.id, Purchase.course_id == course_id)
    )
    if existing:
        return existing

    purchase = Purchase(user_id=current_user.id, course_id=course_id, status="paid")
    db.add(purchase)
    await db.commit()
    return await db.scalar(
        select(Purchase).options(selectinload(Purchase.course)).where(Purchase.id == purchase.id)
    )


@router.get("/my", response_model=list[PurchaseResponse])
async def my_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Purchase]:
    purchases = await db.scalars(
        select(Purchase)
        .options(selectinload(Purchase.course))
        .where(Purchase.user_id == current_user.id)
        .order_by(Purchase.created_at.desc())
    )
    return list(purchases)
