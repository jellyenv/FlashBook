"""Artist address book (contacts)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.domain_schemas import ContactCreate, ContactRead, ContactUpdate
from app.models import Contact, User
from app.services.clerk_auth import get_clerk_user

router = APIRouter()


@router.get("/", response_model=list[ContactRead])
async def list_contacts(
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    result = await db.execute(
        select(Contact).where(Contact.artist_id == artist.id).order_by(Contact.name)
    )
    return result.scalars().all()


@router.post("/", response_model=ContactRead)
async def create_contact(
    payload: ContactCreate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    contact = Contact(
        **payload.model_dump(mode="json", exclude_none=False), artist_id=artist.id
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.patch("/{contact_id}", response_model=ContactRead)
async def update_contact(
    contact_id: UUID,
    payload: ContactUpdate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    contact = (
        (
            await db.execute(
                select(Contact).where(
                    Contact.id == contact_id, Contact.artist_id == artist.id
                )
            )
        )
        .scalars()
        .first()
    )
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found.")
    for key, value in payload.model_dump(mode="json", exclude_unset=True).items():
        setattr(contact, key, value)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    contact = (
        (
            await db.execute(
                select(Contact).where(
                    Contact.id == contact_id, Contact.artist_id == artist.id
                )
            )
        )
        .scalars()
        .first()
    )
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found.")
    await db.delete(contact)
    await db.commit()
    return {"message": "Contact deleted."}
