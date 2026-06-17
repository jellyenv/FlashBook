"""Artist merch products CRUD."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.domain_schemas import ProductCreate, ProductRead, ProductUpdate
from app.models import Product, User
from app.services.clerk_auth import get_clerk_user

router = APIRouter()


async def _owned(db: AsyncSession, product_id: UUID, artist_id) -> Product:
    product = (
        (
            await db.execute(
                select(Product).where(
                    Product.id == product_id, Product.artist_id == artist_id
                )
            )
        )
        .scalars()
        .first()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


def _apply_image(data: dict) -> dict:
    """Translate the single image_url field into the JSON images list."""
    if "image_url" in data:
        url = data.pop("image_url")
        data["images"] = [url] if url else None
    return data


@router.get("/", response_model=list[ProductRead])
async def list_products(
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    result = await db.execute(
        select(Product)
        .where(Product.artist_id == artist.id)
        .order_by(Product.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=ProductRead)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    product = Product(**_apply_image(payload.model_dump()), artist_id=artist.id)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    product = await _owned(db, product_id, artist.id)
    for key, value in _apply_image(payload.model_dump(exclude_unset=True)).items():
        setattr(product, key, value)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}")
async def delete_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    product = await _owned(db, product_id, artist.id)
    await db.delete(product)
    await db.commit()
    return {"message": "Product deleted."}
