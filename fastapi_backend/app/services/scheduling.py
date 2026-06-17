"""Availability & conflict logic — the single source of truth for bookable slots,
shared by the artist calendar and the public booking page.

available_slots(date) = weekly rules − exceptions − existing appointments (± buffers)
                         − min-notice − max-advance window.
"""

from datetime import date as date_cls, datetime, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Appointment,
    ArtistProfile,
    AvailabilityException,
    AvailabilityRule,
    BoothMember,
)
from app.models.enums import AppointmentStatus, AvailabilityExceptionType

# Appointment statuses that occupy time on the calendar.
ACTIVE_STATUSES = [
    AppointmentStatus.requested.value,
    AppointmentStatus.under_review.value,
    AppointmentStatus.confirmed.value,
]


async def _artist_profile(session: AsyncSession, artist_id: UUID) -> ArtistProfile | None:
    result = await session.execute(
        select(ArtistProfile).where(ArtistProfile.user_id == artist_id)
    )
    return result.scalars().first()


async def _occupied_intervals(
    session: AsyncSession, artist_id: UUID, day_start: datetime, day_end: datetime
) -> list[tuple[datetime, datetime]]:
    """Existing appointment intervals (expanded by their buffers) on a given day."""
    result = await session.execute(
        select(Appointment).where(
            Appointment.artist_id == artist_id,
            Appointment.status.in_(ACTIVE_STATUSES),
            Appointment.start_at < day_end,
            Appointment.end_at > day_start,
        )
    )
    intervals = []
    for appt in result.scalars().all():
        start = appt.start_at - timedelta(minutes=appt.buffer_before_minutes or 0)
        end = appt.end_at + timedelta(minutes=appt.buffer_after_minutes or 0)
        intervals.append((start, end))
    return intervals


async def available_slots(
    session: AsyncSession, artist_id: UUID, target: date_cls
) -> list[dict]:
    profile = await _artist_profile(session, artist_id)
    if profile is None or not profile.accepting_bookings:
        return []

    tz = ZoneInfo(profile.timezone)
    now = datetime.now(timezone.utc)
    min_start = now + timedelta(minutes=profile.booking_min_notice_minutes)
    max_day = (now.astimezone(tz).date()) + timedelta(
        days=profile.booking_max_advance_days
    )
    if target > max_day:
        return []

    # Exception for the day wins over the weekly rule.
    exc = (
        await session.execute(
            select(AvailabilityException).where(
                AvailabilityException.artist_id == artist_id,
                AvailabilityException.date == target,
            )
        )
    ).scalars().first()

    windows: list[tuple] = []  # (start_time, end_time, slot_minutes)
    if exc is not None:
        if exc.type == AvailabilityExceptionType.closed.value:
            return []
        if exc.start_time and exc.end_time:
            windows.append((exc.start_time, exc.end_time, profile.default_slot_minutes))
    else:
        rules = (
            await session.execute(
                select(AvailabilityRule).where(
                    AvailabilityRule.artist_id == artist_id,
                    AvailabilityRule.day_of_week == target.weekday(),
                    AvailabilityRule.is_closed.is_(False),
                )
            )
        ).scalars().all()
        for rule in rules:
            if rule.effective_from and target < rule.effective_from:
                continue
            if rule.effective_to and target > rule.effective_to:
                continue
            windows.append((rule.start_time, rule.end_time, rule.slot_minutes))

    if not windows:
        return []

    day_start = datetime.combine(target, datetime.min.time(), tzinfo=tz)
    day_end = day_start + timedelta(days=1)
    occupied = await _occupied_intervals(session, artist_id, day_start, day_end)

    slots: list[dict] = []
    for start_t, end_t, slot_minutes in windows:
        slot_minutes = slot_minutes or profile.default_slot_minutes
        cursor = datetime.combine(target, start_t, tzinfo=tz)
        window_end = datetime.combine(target, end_t, tzinfo=tz)
        step = timedelta(minutes=slot_minutes)
        while cursor + step <= window_end:
            slot_end = cursor + step
            if cursor < min_start:
                cursor = slot_end
                continue
            clash = any(s < slot_end and e > cursor for s, e in occupied)
            if not clash:
                slots.append({"start_at": cursor, "end_at": slot_end})
            cursor = slot_end
    return slots


async def has_conflict(
    session: AsyncSession,
    artist_id: UUID,
    start_at: datetime,
    end_at: datetime,
    *,
    exclude_id: UUID | None = None,
    booth_id: UUID | None = None,
) -> bool:
    """True if [start_at, end_at) overlaps an active appointment for the artist, or for
    any artist sharing the given booth (shared-booth double-book prevention)."""
    artist_ids = [artist_id]
    if booth_id is not None:
        members = (
            await session.execute(
                select(BoothMember.artist_id).where(BoothMember.booth_id == booth_id)
            )
        ).scalars().all()
        artist_ids = list({artist_id, *members})

    query = select(Appointment).where(
        Appointment.artist_id.in_(artist_ids),
        Appointment.status.in_(ACTIVE_STATUSES),
        Appointment.start_at < end_at,
        Appointment.end_at > start_at,
    )
    if exclude_id is not None:
        query = query.where(Appointment.id != exclude_id)
    result = await session.execute(query)
    return result.scalars().first() is not None
