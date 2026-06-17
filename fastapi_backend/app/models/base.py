"""Declarative base, shared mixins, and column helpers for FlashBook models."""

from datetime import datetime
from enum import Enum
from typing import Type
from uuid import uuid4

from sqlalchemy import Column, DateTime, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def uuid_pk() -> Column:
    """Standard UUID primary key used across all FlashBook tables."""
    return Column(UUID(as_uuid=True), primary_key=True, default=uuid4)


def str_enum(enum_cls: Type[Enum]) -> SAEnum:
    """A VARCHAR-backed enum column that stores the enum *value*.

    native_enum=False keeps Alembic autogenerate simple (no Postgres enum types).
    """
    return SAEnum(
        enum_cls,
        native_enum=False,
        validate_strings=True,
        values_callable=lambda x: [e.value for e in x],
    )


class TimestampMixin:
    """Adds created_at / updated_at managed by the database."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
