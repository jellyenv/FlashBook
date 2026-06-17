"""Clerk session endpoints: confirm/enrich the local profile for the signed-in user."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.models import ArtistProfile, User
from app.services.clerk_auth import get_clerk_user

router = APIRouter()


class ClerkSync(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None


class ClerkMe(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    role: str
    slug: str | None = None


async def _artist_slug(db: AsyncSession, user_id) -> str | None:
    profile = (
        await db.execute(select(ArtistProfile).where(ArtistProfile.user_id == user_id))
    ).scalars().first()
    return profile.slug if profile else None


@router.get("/me", response_model=ClerkMe)
async def clerk_me(
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_clerk_user),
):
    return ClerkMe(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        slug=await _artist_slug(db, user.id),
    )


@router.post("/sync", response_model=ClerkMe)
async def clerk_sync(
    payload: ClerkSync,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_clerk_user),
):
    """Enrich the local record with the real Clerk email/name (idempotent)."""
    changed = False
    # Adopt a real email only while we still hold the placeholder and it's unused.
    if payload.email and user.email.endswith("@clerk.local"):
        existing = (
            await db.execute(select(User).where(User.email == payload.email))
        ).scalars().first()
        if existing is None:
            user.email = payload.email
            changed = True
    if payload.full_name and not user.full_name:
        user.full_name = payload.full_name
        changed = True

    profile = (
        await db.execute(select(ArtistProfile).where(ArtistProfile.user_id == user.id))
    ).scalars().first()
    if profile and payload.full_name and profile.display_name in (
        None,
        "",
        user.email.split("@")[0],
    ):
        profile.display_name = payload.full_name
        changed = True

    if changed:
        await db.commit()
        await db.refresh(user)

    return ClerkMe(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        slug=profile.slug if profile else None,
    )
