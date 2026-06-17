"""Scheduling: availability rules/exceptions, appointments, groups, booths."""

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin, str_enum, uuid_pk
from .enums import (
    AppointmentSource,
    AppointmentStatus,
    AvailabilityExceptionType,
    ColorType,
    DepositStatus,
)


class AvailabilityRule(TimestampMixin, Base):
    """Recurring weekly business hours, optionally bounded by an effective window."""

    __tablename__ = "availability_rules"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon .. 6=Sun
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    slot_minutes = Column(Integer, nullable=False, default=60)
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)  # null = indefinite
    is_closed = Column(Boolean, nullable=False, default=False)


class AvailabilityException(TimestampMixin, Base):
    """One-off custom hours or closures/blackouts for a specific date."""

    __tablename__ = "availability_exceptions"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    date = Column(Date, nullable=False)
    type = Column(str_enum(AvailabilityExceptionType), nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    note = Column(String, nullable=True)


class ArtistGroup(TimestampMixin, Base):
    """A shop / collective whose members' calendars can be synced & filtered."""

    __tablename__ = "artist_groups"

    id = uuid_pk()
    owner_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)

    members = relationship(
        "ArtistGroupMember", back_populates="group", cascade="all, delete-orphan"
    )
    booths = relationship(
        "Booth", back_populates="group", cascade="all, delete-orphan"
    )


class ArtistGroupMember(TimestampMixin, Base):
    __tablename__ = "artist_group_members"
    __table_args__ = (UniqueConstraint("group_id", "artist_id"),)

    id = uuid_pk()
    group_id = Column(UUID(as_uuid=True), ForeignKey("artist_groups.id"), nullable=False)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    color = Column(String, nullable=True)  # hex, for legible side-by-side calendars
    avatar_url = Column(String, nullable=True)
    display_name = Column(String, nullable=True)

    group = relationship("ArtistGroup", back_populates="members")


class Booth(TimestampMixin, Base):
    """A physical booth that may be shared; shared booths block double-booking."""

    __tablename__ = "booths"

    id = uuid_pk()
    group_id = Column(UUID(as_uuid=True), ForeignKey("artist_groups.id"), nullable=True)
    name = Column(String, nullable=False)

    group = relationship("ArtistGroup", back_populates="booths")
    members = relationship(
        "BoothMember", back_populates="booth", cascade="all, delete-orphan"
    )


class BoothMember(TimestampMixin, Base):
    __tablename__ = "booth_members"
    __table_args__ = (UniqueConstraint("booth_id", "artist_id"),)

    id = uuid_pk()
    booth_id = Column(UUID(as_uuid=True), ForeignKey("booths.id"), nullable=False)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)

    booth = relationship("Booth", back_populates="members")


class Appointment(TimestampMixin, Base):
    __tablename__ = "appointments"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    client_user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    booth_id = Column(UUID(as_uuid=True), ForeignKey("booths.id"), nullable=True)

    title = Column(String, nullable=True)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(
        str_enum(AppointmentStatus),
        nullable=False,
        default=AppointmentStatus.requested.value,
    )
    source = Column(str_enum(AppointmentSource), nullable=False)

    buffer_before_minutes = Column(Integer, nullable=False, default=0)
    buffer_after_minutes = Column(Integer, nullable=False, default=0)

    # Tattoo detail
    size = Column(String, nullable=True)
    placement = Column(String, nullable=True)
    color_type = Column(str_enum(ColorType), nullable=True)
    subject = Column(Text, nullable=True)

    # Booking extras (accessibility + logistics)
    accommodations_notes = Column(Text, nullable=True)
    has_guests = Column(Boolean, nullable=False, default=False)
    guests_notes = Column(Text, nullable=True)

    # Snapshot of who booked (clients may have no account)
    client_name = Column(String, nullable=True)
    client_email = Column(String, nullable=True)
    client_phone = Column(String, nullable=True)

    deposit_cents = Column(Integer, nullable=False, default=0)
    deposit_status = Column(
        str_enum(DepositStatus), nullable=False, default=DepositStatus.none.value
    )
