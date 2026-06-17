"""Artist flash pieces CRUD."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.domain_schemas import FlashPieceCreate, FlashPieceRead, FlashPieceUpdate
from app.models import FlashPiece, User
from app.services.clerk_auth import get_clerk_user

router = APIRouter()


async def _owned(db: AsyncSession, piece_id: UUID, artist_id) -> FlashPiece:
    piece = (
        await db.execute(
            select(FlashPiece).where(
                FlashPiece.id == piece_id, FlashPiece.artist_id == artist_id
            )
        )
    ).scalars().first()
    if piece is None:
        raise HTTPException(status_code=404, detail="Flash piece not found.")
    return piece


@router.get("/", response_model=list[FlashPieceRead])
async def list_flash(
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    result = await db.execute(
        select(FlashPiece)
        .where(FlashPiece.artist_id == artist.id)
        .order_by(FlashPiece.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=FlashPieceRead)
async def create_flash(
    payload: FlashPieceCreate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    piece = FlashPiece(**payload.model_dump(mode="json"), artist_id=artist.id)
    db.add(piece)
    await db.commit()
    await db.refresh(piece)
    return piece


@router.patch("/{piece_id}", response_model=FlashPieceRead)
async def update_flash(
    piece_id: UUID,
    payload: FlashPieceUpdate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    piece = await _owned(db, piece_id, artist.id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        if key == "status" and value is not None:
            value = value.value
        setattr(piece, key, value)
    await db.commit()
    await db.refresh(piece)
    return piece


@router.delete("/{piece_id}")
async def delete_flash(
    piece_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    piece = await _owned(db, piece_id, artist.id)
    await db.delete(piece)
    await db.commit()
    return {"message": "Flash piece deleted."}
