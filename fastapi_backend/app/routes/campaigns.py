"""Artist campaign drafts. Sending is wired up with the SMS/email providers."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.domain_schemas import CampaignCreate, CampaignRead
from app.models import Campaign, User
from app.models.enums import CampaignStatus
from app.services.clerk_auth import get_clerk_user

router = APIRouter()


@router.get("/", response_model=list[CampaignRead])
async def list_campaigns(
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    result = await db.execute(
        select(Campaign)
        .where(Campaign.artist_id == artist.id)
        .order_by(Campaign.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=CampaignRead)
async def create_campaign(
    payload: CampaignCreate,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    campaign = Campaign(
        artist_id=artist.id,
        name=payload.name,
        body=payload.body,
        link=payload.link,
        channel=payload.channel.value,
        audience=payload.audience,
        status=CampaignStatus.draft.value,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    artist: User = Depends(get_clerk_user),
):
    campaign = (
        await db.execute(
            select(Campaign).where(
                Campaign.id == campaign_id, Campaign.artist_id == artist.id
            )
        )
    ).scalars().first()
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    await db.delete(campaign)
    await db.commit()
    return {"message": "Campaign deleted."}
