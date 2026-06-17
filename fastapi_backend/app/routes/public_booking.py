"""Public, unauthenticated booking surface for a given artist slug."""

from datetime import date as date_cls, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_async_session
from app.domain_schemas import (
    BookingRequest,
    BookingResult,
    CheckoutRequest,
    CheckoutResult,
    FlashPieceRead,
    PortfolioImageRead,
    ProductRead,
    PublicArtistRead,
    SlotRead,
    ThemeSettingsRead,
)
from app.models import (
    Appointment,
    ArtistProfile,
    BookingPageLayout,
    Contact,
    FlashPiece,
    Notification,
    Order,
    OrderItem,
    PortfolioImage,
    Product,
    ThemeSettings,
)
from app.models.enums import AppointmentSource, AppointmentStatus, DepositStatus
from app.ratelimit import limiter
from app.services.scheduling import has_conflict

router = APIRouter()


async def _artist_by_slug(db: AsyncSession, slug: str) -> ArtistProfile:
    profile = (
        await db.execute(select(ArtistProfile).where(ArtistProfile.slug == slug))
    ).scalars().first()
    if profile is None:
        raise HTTPException(status_code=404, detail="Artist not found.")
    return profile


@router.get("/artists/{slug}", response_model=PublicArtistRead)
async def get_public_artist(
    slug: str, db: AsyncSession = Depends(get_async_session)
):
    profile = await _artist_by_slug(db, slug)
    theme = (
        await db.execute(
            select(ThemeSettings).where(ThemeSettings.owner_id == profile.user_id)
        )
    ).scalars().first()
    layout = (
        await db.execute(
            select(BookingPageLayout).where(
                BookingPageLayout.artist_id == profile.user_id
            )
        )
    ).scalars().first()
    banner = None
    modules = None
    if layout and layout.announcement_active:
        banner = layout.announcement_banner
    if layout and layout.published and layout.modules:
        modules = layout.modules
    return PublicArtistRead(
        slug=profile.slug,
        display_name=profile.display_name,
        bio=profile.bio,
        location=profile.location,
        instagram_url=profile.instagram_url,
        deposit_default_cents=profile.deposit_default_cents,
        accepting_bookings=profile.accepting_bookings,
        require_review_before_confirm=profile.require_review_before_confirm,
        theme=ThemeSettingsRead.model_validate(theme) if theme else None,
        announcement_banner=banner,
        modules=modules,
    )


@router.get("/artists/{slug}/portfolio", response_model=list[PortfolioImageRead])
async def get_public_portfolio(
    slug: str, db: AsyncSession = Depends(get_async_session)
):
    profile = await _artist_by_slug(db, slug)
    result = await db.execute(
        select(PortfolioImage)
        .where(PortfolioImage.artist_id == profile.user_id)
        .order_by(PortfolioImage.sort_order, PortfolioImage.created_at.desc())
    )
    return result.scalars().all()


@router.get("/artists/{slug}/products", response_model=list[ProductRead])
async def get_public_products(
    slug: str, db: AsyncSession = Depends(get_async_session)
):
    profile = await _artist_by_slug(db, slug)
    result = await db.execute(
        select(Product)
        .where(Product.artist_id == profile.user_id, Product.active.is_(True))
        .order_by(Product.created_at.desc())
    )
    return result.scalars().all()


@router.post("/artists/{slug}/checkout", response_model=CheckoutResult)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def checkout(
    request: Request,
    slug: str,
    payload: CheckoutRequest,
    db: AsyncSession = Depends(get_async_session),
):
    profile = await _artist_by_slug(db, slug)
    if not payload.accepted_terms:
        raise HTTPException(
            status_code=400, detail="Please accept the terms and conditions."
        )
    if not payload.items:
        raise HTTPException(status_code=400, detail="Your cart is empty.")

    ids = [i.product_id for i in payload.items]
    products = (
        await db.execute(
            select(Product).where(
                Product.id.in_(ids),
                Product.artist_id == profile.user_id,
                Product.active.is_(True),
            )
        )
    ).scalars().all()
    by_id = {p.id: p for p in products}

    order = Order(
        artist_id=profile.user_id,
        status="pending_payment",
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        shipping_address=payload.shipping_address,
        notes=payload.notes,
        accepted_terms=True,
        accepted_terms_at=datetime.now(timezone.utc),
    )
    db.add(order)
    await db.flush()

    total = 0
    for item in payload.items:
        product = by_id.get(item.product_id)
        if product is None:
            raise HTTPException(
                status_code=400,
                detail="A product in your cart is no longer available.",
            )
        total += product.price_cents * item.quantity
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                title=product.title,
                unit_price_cents=product.price_cents,
                quantity=item.quantity,
            )
        )
    order.total_cents = total

    db.add(
        Notification(
            user_id=profile.user_id,
            type="merch_order",
            payload={
                "order_id": str(order.id),
                "total_cents": total,
                "customer": payload.customer_name,
            },
            action_url="/studio/merch",
        )
    )
    await db.commit()
    await db.refresh(order)

    return CheckoutResult(
        order_id=order.id,
        total_cents=total,
        status=order.status,
        message="Order placed! The artist will reach out to arrange payment.",
    )


@router.get("/artists/{slug}/flash", response_model=list[FlashPieceRead])
async def get_public_flash(
    slug: str, db: AsyncSession = Depends(get_async_session)
):
    profile = await _artist_by_slug(db, slug)
    result = await db.execute(
        select(FlashPiece)
        .where(FlashPiece.artist_id == profile.user_id)
        .order_by(FlashPiece.created_at.desc())
    )
    return result.scalars().all()


@router.get("/artists/{slug}/slots", response_model=list[SlotRead])
async def get_public_slots(
    slug: str,
    date: date_cls = Query(...),
    db: AsyncSession = Depends(get_async_session),
):
    profile = await _artist_by_slug(db, slug)
    # Import here to avoid a circular import at module load.
    from app.services.scheduling import available_slots

    return await available_slots(db, profile.user_id, date)


@router.post("/artists/{slug}/book", response_model=BookingResult)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def book(
    request: Request,
    slug: str,
    payload: BookingRequest,
    db: AsyncSession = Depends(get_async_session),
):
    profile = await _artist_by_slug(db, slug)
    if not profile.accepting_bookings:
        raise HTTPException(status_code=400, detail="This artist isn't accepting bookings.")
    if not payload.age_confirmed:
        raise HTTPException(
            status_code=400,
            detail="You must confirm you are 18 or older to book.",
        )
    if payload.end_at <= payload.start_at:
        raise HTTPException(status_code=400, detail="Invalid time range.")
    if await has_conflict(db, profile.user_id, payload.start_at, payload.end_at):
        raise HTTPException(
            status_code=409,
            detail="That time was just taken. Please pick another slot.",
        )

    # Link or create the contact in the artist's address book.
    contact = (
        await db.execute(
            select(Contact).where(
                Contact.artist_id == profile.user_id,
                Contact.email == payload.client_email,
            )
        )
    ).scalars().first()
    if contact is None:
        contact = Contact(
            artist_id=profile.user_id,
            name=payload.client_name,
            email=payload.client_email,
            phone=payload.client_phone,
        )
        db.add(contact)
        await db.flush()

    review = profile.require_review_before_confirm
    status_value = (
        AppointmentStatus.under_review.value
        if review
        else AppointmentStatus.confirmed.value
    )
    appt = Appointment(
        artist_id=profile.user_id,
        contact_id=contact.id,
        title=payload.subject,
        start_at=payload.start_at,
        end_at=payload.end_at,
        status=status_value,
        source=AppointmentSource.client_booking.value,
        size=payload.size,
        placement=payload.placement,
        color_type=payload.color_type.value if payload.color_type else None,
        subject=payload.subject,
        accommodations_notes=payload.accommodations_notes,
        has_guests=payload.has_guests,
        guests_notes=payload.guests_notes,
        client_name=payload.client_name,
        client_email=payload.client_email,
        client_phone=payload.client_phone,
        deposit_cents=profile.deposit_default_cents,
        # Phase 1: card captured (test mode) but not charged; deposit marked pending.
        deposit_status=(
            DepositStatus.pending.value
            if payload.payment_method_id
            else DepositStatus.none.value
        ),
    )
    db.add(appt)
    await db.flush()

    # Action item for the artist dashboard.
    db.add(
        Notification(
            user_id=profile.user_id,
            type="booking_review" if review else "booking_confirmed",
            payload={
                "appointment_id": str(appt.id),
                "client_name": payload.client_name,
            },
            action_url=f"/studio/calendar?appointment={appt.id}",
        )
    )
    await db.commit()
    await db.refresh(appt)

    message = (
        "Your request is being reviewed — thank you for your interest!"
        if review
        else "Your booking is confirmed!"
    )
    return BookingResult(
        appointment_id=appt.id, status=AppointmentStatus(status_value), message=message
    )
