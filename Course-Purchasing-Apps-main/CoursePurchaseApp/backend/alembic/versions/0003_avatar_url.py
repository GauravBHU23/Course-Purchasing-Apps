"""add avatar_url to users

Revision ID: 0003_avatar_url
Revises: 0002_profile_password_reset
Create Date: 2026-05-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_avatar_url"
down_revision: str | None = "0002_profile_password_reset"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
