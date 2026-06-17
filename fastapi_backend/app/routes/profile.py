"""Artist profile and theme settings."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.domain_schemas import (
    ArtistProfileRead,
    ArtistProfileUpdate,
    ThemeSettingsRead,
    ThemeSettingsUpdate,
)
from app.models import ArtistProfile, ThemeSettings, User
from app.models.enums import ButtonShape
from app.services.clerk_auth import get_clerk_user

router = APIRouter()


async def _profile(db: AsyncSession, artist_id) -> ArtistProfile:
    profile = (
        (
            await db.execute(
                select(ArtistProfile).where(ArtistProfile.user_id == artist_id)
            )
        )
        .scalars()
        .first()
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Artist profile not found.")
    return profile


@router.get("/me", response_model=ArtistProfileRead)
async def get_my_profile(
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    return await _profile(db, artist.id)


@router.patch("/me", response_model=ArtistProfileRead)
async def update_my_profile(
    payload: ArtistProfileUpdate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    profile = await _profile(db, artist.id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    await db.commit()
    await db.refresh(profile)
    return profile


async def _get_or_create_theme(db: AsyncSession, owner_id) -> ThemeSettings:
    theme = (
        (
            await db.execute(
                select(ThemeSettings).where(ThemeSettings.owner_id == owner_id)
            )
        )
        .scalars()
        .first()
    )
    if theme is None:
        theme = ThemeSettings(owner_id=owner_id, button_shape=ButtonShape.rounded.value)
        db.add(theme)
        await db.commit()
        await db.refresh(theme)
    return theme


@router.get("/theme", response_model=ThemeSettingsRead)
async def get_theme(
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    return await _get_or_create_theme(db, artist.id)


@router.put("/theme", response_model=ThemeSettingsRead)
async def update_theme(
    payload: ThemeSettingsUpdate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    theme = await _get_or_create_theme(db, artist.id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        if key == "button_shape" and value is not None:
            value = value.value
        setattr(theme, key, value)
    await db.commit()
    await db.refresh(theme)
    return theme
