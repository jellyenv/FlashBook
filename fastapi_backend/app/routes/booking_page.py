"""Artist booking-page layout: draft vs published module config + announcement."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.domain_schemas import BookingPageRead, BookingPageUpdate
from app.models import BookingPageLayout, User
from app.services.clerk_auth import get_clerk_user

router = APIRouter()


async def _get_or_create(db: AsyncSession, artist_id) -> BookingPageLayout:
    layout = (
        await db.execute(
            select(BookingPageLayout).where(BookingPageLayout.artist_id == artist_id)
        )
    ).scalars().first()
    if layout is None:
        layout = BookingPageLayout(artist_id=artist_id, published=False)
        db.add(layout)
        await db.commit()
        await db.refresh(layout)
    return layout


@router.get("/", response_model=BookingPageRead)
async def get_layout(
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    return await _get_or_create(db, artist.id)


@router.put("/", response_model=BookingPageRead)
async def update_layout(
    payload: BookingPageUpdate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    layout = await _get_or_create(db, artist.id)
    if payload.draft is not None:
        layout.draft = [m.model_dump() for m in payload.draft]
    if payload.announcement_banner is not None:
        layout.announcement_banner = payload.announcement_banner
    if payload.announcement_active is not None:
        layout.announcement_active = payload.announcement_active
    if payload.publish:
        # Promote the draft (or current modules) to the published layout.
        layout.modules = layout.draft or layout.modules
        layout.published = True
    await db.commit()
    await db.refresh(layout)
    return layout
