"""Artist appointments: list by range, manual create (no-overlap + booth check),
update (incl. status transitions), delete."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.domain_schemas import (
    AppointmentCreate,
    AppointmentRead,
    AppointmentUpdate,
)
from app.models import Appointment, Contact, User
from app.models.enums import AppointmentSource, AppointmentStatus
from app.services.scheduling import has_conflict
from app.services.clerk_auth import get_clerk_user

router = APIRouter()


async def _find_or_create_contact(
    db: AsyncSession, artist_id: UUID, payload: AppointmentCreate
) -> Contact:
    """Match an existing contact by email/phone, else create one for later reference."""
    contact = None
    if payload.client_email:
        contact = (
            (
                await db.execute(
                    select(Contact).where(
                        Contact.artist_id == artist_id,
                        Contact.email == payload.client_email,
                    )
                )
            )
            .scalars()
            .first()
        )
    if contact is None and payload.client_phone:
        contact = (
            (
                await db.execute(
                    select(Contact).where(
                        Contact.artist_id == artist_id,
                        Contact.phone == payload.client_phone,
                    )
                )
            )
            .scalars()
            .first()
        )
    if contact is None:
        contact = Contact(
            artist_id=artist_id,
            name=payload.client_name,
            email=payload.client_email,
            phone=payload.client_phone,
            instagram=payload.client_instagram,
        )
        db.add(contact)
        await db.flush()
    return contact


@router.get("/", response_model=list[AppointmentRead])
async def list_appointments(
    start: datetime = Query(...),
    end: datetime = Query(...),
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    result = await db.execute(
        select(Appointment)
        .where(
            Appointment.artist_id == artist.id,
            Appointment.start_at < end,
            Appointment.end_at > start,
        )
        .order_by(Appointment.start_at)
    )
    return result.scalars().all()


@router.post("/", response_model=AppointmentRead)
async def create_appointment(
    payload: AppointmentCreate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    if payload.end_at <= payload.start_at:
        raise HTTPException(status_code=400, detail="end_at must be after start_at.")
    if await has_conflict(
        db, artist.id, payload.start_at, payload.end_at, booth_id=payload.booth_id
    ):
        raise HTTPException(
            status_code=409,
            detail="This time overlaps an existing appointment.",
        )
    contact = await _find_or_create_contact(db, artist.id, payload)
    appt = Appointment(
        artist_id=artist.id,
        contact_id=contact.id,
        title=payload.title,
        start_at=payload.start_at,
        end_at=payload.end_at,
        status=AppointmentStatus.confirmed.value,
        source=AppointmentSource.artist_manual.value,
        size=payload.size,
        placement=payload.placement,
        color_type=payload.color_type.value if payload.color_type else None,
        subject=payload.subject,
        accommodations_notes=payload.accommodations_notes,
        has_guests=payload.has_guests,
        guests_notes=payload.guests_notes,
        client_name=payload.client_name,
        client_email=payload.client_email,
        client_phone=payload.client_phone,
        deposit_cents=payload.deposit_cents,
        booth_id=payload.booth_id,
        buffer_before_minutes=payload.buffer_before_minutes,
        buffer_after_minutes=payload.buffer_after_minutes,
    )
    db.add(appt)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.get("/{appointment_id}", response_model=AppointmentRead)
async def get_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    appt = await _owned_appointment(db, appointment_id, artist.id)
    return appt


@router.patch("/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    appointment_id: UUID,
    payload: AppointmentUpdate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    appt = await _owned_appointment(db, appointment_id, artist.id)
    data = payload.model_dump(exclude_unset=True)

    new_start = data.get("start_at", appt.start_at)
    new_end = data.get("end_at", appt.end_at)
    if new_end <= new_start:
        raise HTTPException(status_code=400, detail="end_at must be after start_at.")
    if ("start_at" in data or "end_at" in data) and await has_conflict(
        db, artist.id, new_start, new_end, exclude_id=appt.id, booth_id=appt.booth_id
    ):
        raise HTTPException(
            status_code=409, detail="This time overlaps an existing appointment."
        )

    for key, value in data.items():
        if key == "color_type" and value is not None:
            value = value.value
        if key == "status" and value is not None:
            value = value.value
        setattr(appt, key, value)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    appt = await _owned_appointment(db, appointment_id, artist.id)
    await db.delete(appt)
    await db.commit()
    return {"message": "Appointment deleted."}


async def _owned_appointment(
    db: AsyncSession, appointment_id: UUID, artist_id: UUID
) -> Appointment:
    appt = (
        (
            await db.execute(
                select(Appointment).where(
                    Appointment.id == appointment_id,
                    Appointment.artist_id == artist_id,
                )
            )
        )
        .scalars()
        .first()
    )
    if appt is None:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    return appt
