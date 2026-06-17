"""Artist portfolio gallery CRUD."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.domain_schemas import PortfolioImageCreate, PortfolioImageRead
from app.models import PortfolioImage, User
from app.services.clerk_auth import get_clerk_user

router = APIRouter()


@router.get("/", response_model=list[PortfolioImageRead])
async def list_portfolio(
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    result = await db.execute(
        select(PortfolioImage)
        .where(PortfolioImage.artist_id == artist.id)
        .order_by(PortfolioImage.sort_order, PortfolioImage.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=PortfolioImageRead)
async def create_portfolio_image(
    payload: PortfolioImageCreate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    next_order = (
        await db.execute(
            select(func.coalesce(func.max(PortfolioImage.sort_order), 0)).where(
                PortfolioImage.artist_id == artist.id
            )
        )
    ).scalar() or 0
    image = PortfolioImage(
        **payload.model_dump(mode="json"),
        artist_id=artist.id,
        sort_order=next_order + 1,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


@router.delete("/{image_id}")
async def delete_portfolio_image(
    image_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    image = (
        await db.execute(
            select(PortfolioImage).where(
                PortfolioImage.id == image_id,
                PortfolioImage.artist_id == artist.id,
            )
        )
    ).scalars().first()
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found.")
    await db.delete(image)
    await db.commit()
    return {"message": "Image deleted."}
