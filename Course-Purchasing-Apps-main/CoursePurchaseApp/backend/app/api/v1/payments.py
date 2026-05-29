from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.course import Course
from app.models.purchase import Purchase
from app.models.user import User
from app.services.payment import (
    INSTAMOJO_MIN_AMOUNT_RUPEES,
    PaymentError,
    create_payment_request,
    get_payment_request,
    is_payment_successful,
)

router = APIRouter(prefix="/payments", tags=["payments"])


class CreatePaymentResponse(BaseModel):
    payment_url: str
    payment_request_id: str


class VerifyResponse(BaseModel):
    status: str
    course_id: str


@router.post("/courses/{course_id}/create", response_model=CreatePaymentResponse)
async def create_course_payment(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CreatePaymentResponse:
    settings = get_settings()
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    amount_rupees = course.price_cents / 100
    if amount_rupees < INSTAMOJO_MIN_AMOUNT_RUPEES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Instamojo requires a minimum payment amount of "
                f"Rs. {INSTAMOJO_MIN_AMOUNT_RUPEES:.2f}. "
                f"This course is priced at Rs. {amount_rupees:.2f}."
            ),
        )

    # Already paid? Don't charge again.
    existing = await db.scalar(
        select(Purchase).where(
            Purchase.user_id == current_user.id,
            Purchase.course_id == course_id,
            Purchase.status == "paid",
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already own this course")

    redirect_url = f"{settings.frontend_url.rstrip('/')}/payment/callback?course_id={course_id}"
    try:
        payment_request = create_payment_request(
            amount_rupees=amount_rupees,
            purpose=course.title,
            buyer_name=current_user.full_name,
            email=current_user.email,
            redirect_url=redirect_url,
        )
    except PaymentError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    # Upsert a pending purchase row tied to this payment request.
    pending = await db.scalar(
        select(Purchase).where(
            Purchase.user_id == current_user.id, Purchase.course_id == course_id
        )
    )
    if pending:
        pending.status = "pending"
        pending.payment_request_id = payment_request["id"]
        pending.payment_id = None
    else:
        db.add(
            Purchase(
                user_id=current_user.id,
                course_id=course_id,
                status="pending",
                payment_request_id=payment_request["id"],
            )
        )
    await db.commit()

    return CreatePaymentResponse(
        payment_url=payment_request["longurl"],
        payment_request_id=payment_request["id"],
    )


@router.post("/verify", response_model=VerifyResponse)
async def verify_payment(
    payment_request_id: str,
    payment_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VerifyResponse:
    purchase = await db.scalar(
        select(Purchase).where(
            Purchase.payment_request_id == payment_request_id,
            Purchase.user_id == current_user.id,
        )
    )
    if not purchase:
        raise HTTPException(status_code=404, detail="Payment record not found")

    if purchase.status == "paid":
        return VerifyResponse(status="paid", course_id=purchase.course_id)

    # Verify with Instamojo server-side (never trust the redirect alone).
    try:
        payment_request = get_payment_request(payment_request_id)
    except PaymentError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    if is_payment_successful(payment_request, payment_id):
        purchase.status = "paid"
        purchase.payment_id = payment_id
        await db.commit()
        return VerifyResponse(status="paid", course_id=purchase.course_id)

    return VerifyResponse(status="pending", course_id=purchase.course_id)
