"""Notifications & compliance: notifications, prefs, waivers, audit log."""

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

from .base import Base, TimestampMixin, uuid_pk


class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"

    id = uuid_pk()
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    type = Column(String, nullable=False)
    payload = Column(JSONB, nullable=True)
    action_url = Column(String, nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)


class NotificationPreference(TimestampMixin, Base):
    __tablename__ = "notification_preferences"

    id = uuid_pk()
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, unique=True
    )
    # e.g. {"booking_confirmed": ["in_app", "email"], "reminder": ["sms"]}
    prefs = Column(JSONB, nullable=False, default=dict)


class Waiver(TimestampMixin, Base):
    """An artist's waiver/consent template."""

    __tablename__ = "waivers"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    active = Column(Boolean, nullable=False, default=True)


class SignedWaiver(TimestampMixin, Base):
    __tablename__ = "signed_waivers"

    id = uuid_pk()
    waiver_id = Column(UUID(as_uuid=True), ForeignKey("waivers.id"), nullable=True)
    appointment_id = Column(
        UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True
    )
    signer_name = Column(String, nullable=False)
    signature = Column(Text, nullable=True)
    dob = Column(Date, nullable=True)
    age_verified = Column(Boolean, nullable=False, default=False)
    health_questionnaire = Column(JSONB, nullable=True)
    signed_at = Column(DateTime(timezone=True), nullable=True)


class AuditLog(TimestampMixin, Base):
    """Immutable trail for assistant actions and sensitive events."""

    __tablename__ = "audit_logs"

    id = uuid_pk()
    actor_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    action = Column(String, nullable=False)
    target = Column(String, nullable=True)
    audit_metadata = Column("metadata", JSONB, nullable=True)


class IssueReport(TimestampMixin, Base):
    """A bug/issue reported from the app. incident_code is echoed to the user and
    written to the server log so reports can be matched to log lines."""

    __tablename__ = "issue_reports"

    id = uuid_pk()
    incident_code = Column(String, nullable=False, unique=True, index=True)
    reporter_role = Column(String, nullable=False, default="anonymous")
    reporter_user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    reporter_email = Column(String, nullable=True)
    page = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    user_agent = Column(String, nullable=True)
    status = Column(String, nullable=False, default="open")
