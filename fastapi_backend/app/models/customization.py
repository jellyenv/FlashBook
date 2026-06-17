"""Per-artist customization: theme settings, booking-page layout, cosmetic assets."""

from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

from .base import Base, TimestampMixin, str_enum, uuid_pk
from .enums import ButtonShape


class ThemeSettings(TimestampMixin, Base):
    __tablename__ = "theme_settings"

    id = uuid_pk()
    owner_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, unique=True
    )
    font = Column(String, nullable=True)
    palette = Column(JSONB, nullable=True)  # named palette + CSS-var overrides
    module_colors = Column(JSONB, nullable=True)
    background_color = Column(String, nullable=True)
    background_image_url = Column(String, nullable=True)
    button_shape = Column(
        str_enum(ButtonShape), nullable=False, default=ButtonShape.rounded.value
    )
    header_image_url = Column(String, nullable=True)
    center_widget_image_url = Column(String, nullable=True)
    accents = Column(JSONB, nullable=True)


class BookingPageLayout(TimestampMixin, Base):
    __tablename__ = "booking_page_layouts"

    id = uuid_pk()
    artist_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, unique=True
    )
    modules = Column(JSONB, nullable=True)  # published, ordered module config
    draft = Column(JSONB, nullable=True)  # unpublished working copy
    published = Column(Boolean, nullable=False, default=False)
    announcement_banner = Column(Text, nullable=True)
    announcement_active = Column(Boolean, nullable=False, default=False)


class CosmeticAsset(TimestampMixin, Base):
    """Developer-uploaded assets sold in the FlashBook Shop."""

    __tablename__ = "cosmetic_assets"

    id = uuid_pk()
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    image_url = Column(String, nullable=False)
    price_cents = Column(Integer, nullable=False, default=0)
    active = Column(Boolean, nullable=False, default=True)


class ArtistAssetPurchase(TimestampMixin, Base):
    __tablename__ = "artist_asset_purchases"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    asset_id = Column(
        UUID(as_uuid=True), ForeignKey("cosmetic_assets.id"), nullable=False
    )
