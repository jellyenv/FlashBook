"""Helpers for slug generation and creating role profiles on registration."""

import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ArtistProfile, ClientProfile, User
from app.models.enums import UserRole


def slugify(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")
    return value or "artist"


async def generate_unique_slug(session: AsyncSession, base: str) -> str:
    base = slugify(base)
    candidate = base
    n = 1
    while True:
        existing = await session.execute(
            select(ArtistProfile).where(ArtistProfile.slug == candidate)
        )
        if existing.scalars().first() is None:
            return candidate
        n += 1
        candidate = f"{base}-{n}"


async def create_profile_for_user(session: AsyncSession, user: User) -> None:
    """Create the artist or client profile that matches the user's role."""
    if user.role == UserRole.artist.value or user.role == UserRole.artist:
        display = user.full_name or user.email.split("@")[0]
        slug = await generate_unique_slug(session, display)
        session.add(
            ArtistProfile(
                user_id=user.id,
                slug=slug,
                display_name=display,
            )
        )
    else:
        session.add(
            ClientProfile(
                user_id=user.id,
                full_name=user.full_name,
                phone=user.phone,
            )
        )
    await session.commit()
