"""Clerk identity bridge for FastAPI.

Verifies Clerk session JWTs against the instance JWKS (issuer derived from the
publishable key) and lazily provisions a local User + ArtistProfile keyed to the
Clerk `sub`, so the existing FlashBook domain (calendar, booking, profiles, theming)
keeps working with Clerk identities.
"""

import base64
import uuid
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_async_session
from app.models import ArtistProfile, User
from app.models.enums import UserRole
from app.services.profiles import generate_unique_slug

# Unusable password sentinel for Clerk-managed accounts (no local password login).
CLERK_PASSWORD_SENTINEL = "clerk-managed-no-local-password"


def _derive_issuer() -> str:
    """Clerk's Frontend API host is base64-encoded inside the publishable key."""
    if settings.CLERK_JWT_ISSUER:
        return settings.CLERK_JWT_ISSUER.rstrip("/")
    pk = settings.CLERK_PUBLISHABLE_KEY
    if not pk:
        raise RuntimeError("CLERK_PUBLISHABLE_KEY is not configured.")
    encoded = pk.split("_", 2)[2]
    decoded = base64.b64decode(encoded + "=" * (-len(encoded) % 4)).decode()
    host = decoded.rstrip("$")
    return f"https://{host}"


@lru_cache(maxsize=1)
def _jwk_client() -> PyJWKClient:
    return PyJWKClient(f"{_derive_issuer()}/.well-known/jwks.json")


def verify_clerk_token(token: str) -> dict:
    """Verify a Clerk session JWT and return its claims (raises on failure)."""
    issuer = _derive_issuer()
    signing_key = _jwk_client().get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        issuer=issuer,
        options={"verify_aud": False},
        leeway=10,
    )


def _bearer_token(request: Request) -> str:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )
    return header.split(" ", 1)[1]


async def _provision_user(db: AsyncSession, claims: dict) -> User:
    """Find or create the local User (+ ArtistProfile) for a Clerk subject."""
    sub = claims.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token (no subject).")

    user = (
        (await db.execute(select(User).where(User.clerk_sub == sub))).scalars().first()
    )
    if user is not None:
        return user

    # Claims may carry email/name if the Clerk JWT template includes them.
    email = claims.get("email") or f"{sub}@clerk.local"
    name = claims.get("name") or claims.get("full_name")

    user = User(
        id=uuid.uuid4(),
        clerk_sub=sub,
        email=email,
        hashed_password=CLERK_PASSWORD_SENTINEL,
        is_active=True,
        is_verified=True,  # Clerk verifies email
        role=UserRole.artist.value,  # studio users are artists
        full_name=name,
    )
    db.add(user)
    await db.flush()

    display = name or email.split("@")[0]
    slug = await generate_unique_slug(db, display)
    db.add(ArtistProfile(user_id=user.id, slug=slug, display_name=display))
    await db.commit()
    await db.refresh(user)
    return user


async def get_clerk_user(
    request: Request,
    db: AsyncSession = Depends(get_async_session),
) -> User:
    """FastAPI dependency: authenticated local User derived from a Clerk token."""
    token = _bearer_token(request)
    try:
        claims = verify_clerk_token(token)
    except Exception as exc:  # noqa: BLE001 - surface as 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session.",
        ) from exc
    return await _provision_user(db, claims)


# Studio users are artists; alias for clarity at call sites.
get_clerk_artist = get_clerk_user
