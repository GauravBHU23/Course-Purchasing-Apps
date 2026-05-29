"""Instamojo payment gateway integration (v1.1 API)."""

import httpx

from app.core.config import get_settings

INSTAMOJO_MIN_AMOUNT_RUPEES = 9.0


class PaymentError(Exception):
    pass


def _headers() -> dict[str, str]:
    settings = get_settings()
    return {
        "X-Api-Key": settings.instamojo_api_key,
        "X-Auth-Token": settings.instamojo_auth_token,
    }


def create_payment_request(
    *,
    amount_rupees: float,
    purpose: str,
    buyer_name: str,
    email: str,
    redirect_url: str,
    webhook_url: str | None = None,
) -> dict:
    """Create an Instamojo payment request. Returns the payment_request dict
    (contains 'id' and 'longurl' to redirect the user to)."""
    settings = get_settings()
    if not settings.instamojo_api_key or not settings.instamojo_auth_token:
        raise PaymentError("Payment gateway is not configured")

    data = {
        "purpose": purpose[:30],
        "amount": f"{amount_rupees:.2f}",
        "buyer_name": buyer_name,
        "email": email,
        "redirect_url": redirect_url,
        "send_email": "false",
        "send_sms": "false",
        "allow_repeated_payments": "false",
    }
    if webhook_url:
        data["webhook"] = webhook_url

    url = f"{settings.instamojo_base_url}/payment-requests/"
    try:
        with httpx.Client(timeout=20) as client:
            resp = client.post(url, data=data, headers=_headers())
    except httpx.HTTPError as exc:
        raise PaymentError(f"Could not reach payment gateway: {exc}") from exc

    body = resp.json() if resp.content else {}
    if resp.status_code not in (200, 201) or not body.get("success"):
        message = body.get("message") or body
        raise PaymentError(f"Payment request failed: {message}")

    return body["payment_request"]


def get_payment_request(payment_request_id: str) -> dict:
    """Fetch a payment request (with its payments) to verify status server-side."""
    settings = get_settings()
    url = f"{settings.instamojo_base_url}/payment-requests/{payment_request_id}/"
    try:
        with httpx.Client(timeout=20) as client:
            resp = client.get(url, headers=_headers())
    except httpx.HTTPError as exc:
        raise PaymentError(f"Could not reach payment gateway: {exc}") from exc

    body = resp.json() if resp.content else {}
    if resp.status_code != 200 or not body.get("success"):
        raise PaymentError("Could not verify payment status")
    return body["payment_request"]


def is_payment_successful(payment_request: dict, payment_id: str | None = None) -> bool:
    """Check whether a payment request has a Credit (successful) payment."""
    if payment_request.get("status") == "Completed":
        return True
    for payment in payment_request.get("payments", []) or []:
        if payment.get("status") == "Credit":
            if payment_id is None or payment.get("payment_id") == payment_id:
                return True
    return False
