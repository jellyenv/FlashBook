"""Request/response schemas for the FlashBook domain routers."""

from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import (
    AppointmentSource,
    AppointmentStatus,
    AvailabilityExceptionType,
    ButtonShape,
    ColorType,
    FlashStatus,
    MessageChannel,
)

ORM = {"from_attributes": True}


# --- Availability ---


class AvailabilityRuleCreate(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    slot_minutes: int = 60
    effective_from: date | None = None
    effective_to: date | None = None
    is_closed: bool = False


class AvailabilityRuleRead(AvailabilityRuleCreate):
    id: UUID
    artist_id: UUID
    model_config = ORM


class AvailabilityExceptionCreate(BaseModel):
    date: date
    type: AvailabilityExceptionType
    start_time: time | None = None
    end_time: time | None = None
    note: str | None = None


class AvailabilityExceptionRead(AvailabilityExceptionCreate):
    id: UUID
    artist_id: UUID
    model_config = ORM


class SlotRead(BaseModel):
    start_at: datetime
    end_at: datetime


# --- Uploads & portfolio ---


class UploadResponse(BaseModel):
    url: str


class PortfolioImageCreate(BaseModel):
    image_url: str
    caption: str | None = None
    is_healed: bool = False
    tattoo_date: date | None = None


class PortfolioImageRead(BaseModel):
    id: UUID
    artist_id: UUID
    image_url: str
    caption: str | None = None
    sort_order: int
    is_healed: bool
    tattoo_date: date | None = None
    model_config = ORM


# --- Flash ---


class FlashPieceCreate(BaseModel):
    image_url: str
    title: str | None = None
    description: str | None = None
    price_min_cents: int | None = None
    price_max_cents: int | None = None
    price_plus: bool = False
    size_min: str | None = None
    size_plus: bool = False
    ask_about: bool = False
    event_tag: str | None = None


class FlashPieceUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price_min_cents: int | None = None
    price_max_cents: int | None = None
    price_plus: bool | None = None
    size_min: str | None = None
    size_plus: bool | None = None
    ask_about: bool | None = None
    event_tag: str | None = None
    status: FlashStatus | None = None


class FlashPieceRead(BaseModel):
    id: UUID
    artist_id: UUID
    image_url: str
    title: str | None = None
    description: str | None = None
    price_min_cents: int | None = None
    price_max_cents: int | None = None
    price_plus: bool
    size_min: str | None = None
    size_plus: bool
    ask_about: bool
    status: FlashStatus
    event_tag: str | None = None
    model_config = ORM


# --- Merch products & checkout ---


class ProductCreate(BaseModel):
    title: str
    description: str | None = None
    price_cents: int = Field(ge=0)
    image_url: str | None = None
    inventory: int | None = None
    active: bool = True


class ProductUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price_cents: int | None = None
    image_url: str | None = None
    inventory: int | None = None
    active: bool | None = None


class ProductRead(BaseModel):
    id: UUID
    artist_id: UUID
    title: str
    description: str | None = None
    price_cents: int
    images: list[str] | None = None
    inventory: int | None = None
    active: bool
    model_config = ORM


class CheckoutItem(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=99)


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem]
    customer_name: str
    customer_email: EmailStr
    customer_phone: str | None = None
    shipping_address: str | None = None
    notes: str | None = None
    accepted_terms: bool = False


class CheckoutResult(BaseModel):
    order_id: UUID
    total_cents: int
    status: str
    message: str


# --- Booking page layout ---


class BookingModule(BaseModel):
    key: str
    enabled: bool = True


class BookingPageRead(BaseModel):
    modules: list[BookingModule] | None = None
    draft: list[BookingModule] | None = None
    published: bool = False
    announcement_banner: str | None = None
    announcement_active: bool = False
    model_config = ORM


class BookingPageUpdate(BaseModel):
    draft: list[BookingModule] | None = None
    announcement_banner: str | None = None
    announcement_active: bool | None = None
    publish: bool = False


# --- Campaigns (drafts; sending arrives with SMS/email providers) ---


class CampaignCreate(BaseModel):
    name: str
    body: str
    link: str | None = None
    channel: MessageChannel = MessageChannel.email
    audience: dict | None = None


class CampaignRead(BaseModel):
    id: UUID
    artist_id: UUID
    name: str
    body: str
    link: str | None = None
    channel: MessageChannel
    status: str
    model_config = ORM


# --- Issue reports ---


class IssueReportCreate(BaseModel):
    message: str
    role: str | None = None
    email: EmailStr | None = None
    page: str | None = None


class IssueReportResult(BaseModel):
    incident_code: str
    message: str


# --- Contacts ---


class ContactCreate(BaseModel):
    name: str
    phone: str | None = None
    email: EmailStr | None = None
    instagram: str | None = None
    alt_ids: dict | None = None
    notes: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    instagram: str | None = None
    alt_ids: dict | None = None
    notes: str | None = None


class ContactRead(BaseModel):
    id: UUID
    artist_id: UUID
    name: str
    phone: str | None = None
    email: str | None = None
    instagram: str | None = None
    alt_ids: dict | None = None
    notes: str | None = None
    model_config = ORM


# --- Appointments ---


class AppointmentCreate(BaseModel):
    """Artist manually entering an appointment."""

    start_at: datetime
    end_at: datetime
    title: str | None = None
    # Client identity (saved to Contacts for later reference)
    client_name: str
    client_phone: str | None = None
    client_email: EmailStr | None = None
    client_instagram: str | None = None
    # Tattoo detail
    size: str | None = None
    placement: str | None = None
    color_type: ColorType | None = None
    subject: str | None = None
    # Logistics
    accommodations_notes: str | None = None
    has_guests: bool = False
    guests_notes: str | None = None
    deposit_cents: int = 0
    booth_id: UUID | None = None
    buffer_before_minutes: int = 0
    buffer_after_minutes: int = 0


class AppointmentUpdate(BaseModel):
    start_at: datetime | None = None
    end_at: datetime | None = None
    title: str | None = None
    status: AppointmentStatus | None = None
    size: str | None = None
    placement: str | None = None
    color_type: ColorType | None = None
    subject: str | None = None
    accommodations_notes: str | None = None
    has_guests: bool | None = None
    guests_notes: str | None = None


class AppointmentRead(BaseModel):
    id: UUID
    artist_id: UUID
    contact_id: UUID | None = None
    client_user_id: UUID | None = None
    booth_id: UUID | None = None
    title: str | None = None
    start_at: datetime
    end_at: datetime
    status: AppointmentStatus
    source: AppointmentSource
    size: str | None = None
    placement: str | None = None
    color_type: ColorType | None = None
    subject: str | None = None
    accommodations_notes: str | None = None
    has_guests: bool
    guests_notes: str | None = None
    client_name: str | None = None
    client_email: str | None = None
    client_phone: str | None = None
    deposit_cents: int
    model_config = ORM


# --- Artist profile & theming ---


class ArtistProfileRead(BaseModel):
    id: UUID
    user_id: UUID
    slug: str
    display_name: str
    business_name: str | None = None
    bio: str | None = None
    location: str | None = None
    timezone: str
    instagram_handle: str | None = None
    instagram_url: str | None = None
    deposit_default_cents: int
    require_review_before_confirm: bool
    accepting_bookings: bool
    booking_min_notice_minutes: int
    booking_max_advance_days: int
    default_slot_minutes: int
    buffer_minutes: int
    currency: str
    cancellation_policy: str | None = None
    auto_charge_day_of: bool
    confirm_before_charge: bool
    model_config = ORM


class ArtistProfileUpdate(BaseModel):
    display_name: str | None = None
    business_name: str | None = None
    bio: str | None = None
    location: str | None = None
    timezone: str | None = None
    instagram_handle: str | None = None
    instagram_url: str | None = None
    deposit_default_cents: int | None = None
    require_review_before_confirm: bool | None = None
    accepting_bookings: bool | None = None
    booking_min_notice_minutes: int | None = None
    booking_max_advance_days: int | None = None
    default_slot_minutes: int | None = None
    buffer_minutes: int | None = None
    cancellation_policy: str | None = None
    auto_charge_day_of: bool | None = None
    confirm_before_charge: bool | None = None


class ThemeSettingsRead(BaseModel):
    font: str | None = None
    palette: dict | None = None
    module_colors: dict | None = None
    background_color: str | None = None
    background_image_url: str | None = None
    button_shape: ButtonShape
    header_image_url: str | None = None
    center_widget_image_url: str | None = None
    accents: dict | None = None
    model_config = ORM


class ThemeSettingsUpdate(BaseModel):
    font: str | None = None
    palette: dict | None = None
    module_colors: dict | None = None
    background_color: str | None = None
    background_image_url: str | None = None
    button_shape: ButtonShape | None = None
    header_image_url: str | None = None
    center_widget_image_url: str | None = None
    accents: dict | None = None


# --- Public booking ---


class PublicArtistRead(BaseModel):
    slug: str
    display_name: str
    bio: str | None = None
    location: str | None = None
    instagram_url: str | None = None
    deposit_default_cents: int
    accepting_bookings: bool
    require_review_before_confirm: bool
    theme: ThemeSettingsRead | None = None
    announcement_banner: str | None = None
    modules: list["BookingModule"] | None = None


class BookingRequest(BaseModel):
    start_at: datetime
    end_at: datetime
    client_name: str
    client_email: EmailStr
    client_phone: str
    size: str | None = None
    placement: str | None = None
    color_type: ColorType | None = None
    subject: str | None = None
    accommodations_notes: str | None = None
    has_guests: bool = False
    guests_notes: str | None = None
    # Stripe SetupIntent payment method id (test mode in Phase 1)
    payment_method_id: str | None = None
    age_confirmed: bool = False


class BookingResult(BaseModel):
    appointment_id: UUID
    status: AppointmentStatus
    message: str
