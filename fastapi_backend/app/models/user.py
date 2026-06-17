"""Identity & tenancy: User (extended), profiles, contacts, assistant grants,
and the email verification code table."""

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin, str_enum, uuid_pk
from .enums import UserRole


class User(SQLAlchemyBaseUserTableUUID, TimestampMixin, Base):
    """Single user table for both artists and clients (fastapi-users base + extras)."""

    role = Column(str_enum(UserRole), nullable=False, default=UserRole.client.value)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    # Clerk identity (set for users authenticated via Clerk)
    clerk_sub = Column(String, nullable=True, unique=True, index=True)

    # 2FA (TOTP)
    totp_secret = Column(String, nullable=True)
    totp_enabled = Column(Boolean, nullable=False, default=False)

    # Demo template relation kept for backwards-compat until the artist app fully
    # replaces it.
    items = relationship("Item", back_populates="user", cascade="all, delete-orphan")

    artist_profile = relationship(
        "ArtistProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    client_profile = relationship(
        "ClientProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class ArtistProfile(TimestampMixin, Base):
    __tablename__ = "artist_profiles"

    id = uuid_pk()
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, unique=True
    )
    slug = Column(String, nullable=False, unique=True, index=True)
    display_name = Column(String, nullable=False)
    business_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    timezone = Column(String, nullable=False, default="America/New_York")
    instagram_handle = Column(String, nullable=True)
    instagram_url = Column(String, nullable=True)

    # Booking policy
    deposit_default_cents = Column(Integer, nullable=False, default=5000)
    require_review_before_confirm = Column(Boolean, nullable=False, default=True)
    accepting_bookings = Column(Boolean, nullable=False, default=True)
    booking_min_notice_minutes = Column(Integer, nullable=False, default=720)  # 12h
    booking_max_advance_days = Column(Integer, nullable=False, default=180)
    default_slot_minutes = Column(Integer, nullable=False, default=60)
    buffer_minutes = Column(Integer, nullable=False, default=15)
    currency = Column(String, nullable=False, default="usd")
    cancellation_policy = Column(Text, nullable=True)

    # Day-of charging behavior (see plan): auto-charge defaults OFF.
    auto_charge_day_of = Column(Boolean, nullable=False, default=False)
    confirm_before_charge = Column(Boolean, nullable=False, default=True)

    user = relationship("User", back_populates="artist_profile")


class ClientProfile(TimestampMixin, Base):
    __tablename__ = "client_profiles"

    id = uuid_pk()
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, unique=True
    )
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    alt_ids = Column(JSONB, nullable=True)
    sms_opt_in = Column(Boolean, nullable=False, default=False)
    notification_prefs = Column(JSONB, nullable=True)

    user = relationship("User", back_populates="client_profile")


class Contact(TimestampMixin, Base):
    """An artist's address-book entry. Clients entered manually may have no account."""

    __tablename__ = "contacts"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    alt_ids = Column(JSONB, nullable=True)
    notes = Column(Text, nullable=True)
    linked_client_user_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=True
    )


class AssistantGrant(TimestampMixin, Base):
    """An artist delegates scoped access to another user (the 'assistant')."""

    __tablename__ = "assistant_grants"

    id = uuid_pk()
    owner_artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    assistant_user_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False
    )
    # Per-function permission checklist, e.g.
    # {"messaging": true, "contacts": false, "appointments": true, ...}
    permissions = Column(JSONB, nullable=False, default=dict)


class EmailVerificationCode(Base):
    """Short-lived 6-digit code emailed for identity verification."""

    __tablename__ = "email_verification_codes"

    id = uuid_pk()
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    attempts = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False)
