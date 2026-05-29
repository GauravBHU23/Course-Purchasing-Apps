"""add payment fields to purchases

Revision ID: 0005_purchase_payment_fields
Revises: 0004_email_verification
Create Date: 2026-05-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_purchase_payment_fields"
down_revision: str | None = "0004_email_verification"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("purchases", sa.Column("payment_request_id", sa.String(length=64), nullable=True))
    op.add_column("purchases", sa.Column("payment_id", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("purchases", "payment_id")
    op.drop_column("purchases", "payment_request_id")
