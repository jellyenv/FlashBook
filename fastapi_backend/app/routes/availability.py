"""Artist-managed business hours, exceptions, and a slot preview for the calendar."""

from datetime import date as date_cls
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.domain_schemas import (
    AvailabilityExceptionCreate,
    AvailabilityExceptionRead,
    AvailabilityRuleCreate,
    AvailabilityRuleRead,
    SlotRead,
)
from app.models import AvailabilityException, AvailabilityRule, User
from app.services.scheduling import available_slots
from app.services.clerk_auth import get_clerk_user

router = APIRouter()


@router.get("/rules", response_model=list[AvailabilityRuleRead])
async def list_rules(
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    result = await db.execute(
        select(AvailabilityRule).where(AvailabilityRule.artist_id == artist.id)
    )
    return result.scalars().all()


@router.post("/rules", response_model=AvailabilityRuleRead)
async def create_rule(
    payload: AvailabilityRuleCreate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    if payload.end_time <= payload.start_time:
        raise HTTPException(
            status_code=400, detail="end_time must be after start_time."
        )
    rule = AvailabilityRule(**payload.model_dump(), artist_id=artist.id)
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    rule = (
        (
            await db.execute(
                select(AvailabilityRule).where(
                    AvailabilityRule.id == rule_id,
                    AvailabilityRule.artist_id == artist.id,
                )
            )
        )
        .scalars()
        .first()
    )
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found.")
    await db.delete(rule)
    await db.commit()
    return {"message": "Rule deleted."}


@router.get("/exceptions", response_model=list[AvailabilityExceptionRead])
async def list_exceptions(
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    result = await db.execute(
        select(AvailabilityException).where(
            AvailabilityException.artist_id == artist.id
        )
    )
    return result.scalars().all()


@router.post("/exceptions", response_model=AvailabilityExceptionRead)
async def create_exception(
    payload: AvailabilityExceptionCreate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    exc = AvailabilityException(**payload.model_dump(), artist_id=artist.id)
    db.add(exc)
    await db.commit()
    await db.refresh(exc)
    return exc


@router.delete("/exceptions/{exception_id}")
async def delete_exception(
    exception_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    exc = (
        (
            await db.execute(
                select(AvailabilityException).where(
                    AvailabilityException.id == exception_id,
                    AvailabilityException.artist_id == artist.id,
                )
            )
        )
        .scalars()
        .first()
    )
    if exc is None:
        raise HTTPException(status_code=404, detail="Exception not found.")
    await db.delete(exc)
    await db.commit()
    return {"message": "Exception deleted."}


@router.get("/slots", response_model=list[SlotRead])
async def preview_slots(
    date: date_cls = Query(...),
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    """Bookable slots for the artist on a date (same engine as public booking)."""
    return await available_slots(db, artist.id, date)
