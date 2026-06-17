"""Galleries & commerce: portfolio, flash, merch products/orders, reviews."""

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin, str_enum, uuid_pk
from .enums import FlashStatus


class PortfolioImage(TimestampMixin, Base):
    __tablename__ = "portfolio_images"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    image_url = Column(String, nullable=False)
    caption = Column(String, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_healed = Column(Boolean, nullable=False, default=False)
    tattoo_date = Column(Date, nullable=True)  # drives the auto-updating "age"


class FlashPiece(TimestampMixin, Base):
    __tablename__ = "flash_pieces"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    image_url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    price_min_cents = Column(Integer, nullable=True)
    price_max_cents = Column(Integer, nullable=True)
    price_plus = Column(Boolean, nullable=False, default=False)  # render "$X+"
    size_min = Column(String, nullable=True)
    size_plus = Column(Boolean, nullable=False, default=False)
    ask_about = Column(Boolean, nullable=False, default=False)  # CTA instead of price
    status = Column(
        str_enum(FlashStatus), nullable=False, default=FlashStatus.available.value
    )
    event_tag = Column(String, nullable=True)  # halloween / friday_13th / etc.


class Product(TimestampMixin, Base):
    __tablename__ = "products"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price_cents = Column(Integer, nullable=False, default=0)
    images = Column(JSONB, nullable=True)
    inventory = Column(Integer, nullable=True)
    active = Column(Boolean, nullable=False, default=True)


class Cart(TimestampMixin, Base):
    __tablename__ = "carts"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    client_user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    session_token = Column(String, nullable=True)  # guest carts

    items = relationship(
        "CartItem", back_populates="cart", cascade="all, delete-orphan"
    )


class CartItem(Base):
    __tablename__ = "cart_items"

    id = uuid_pk()
    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    cart = relationship("Cart", back_populates="items")


class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    client_user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    total_cents = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="pending_payment")
    stripe_payment_intent_id = Column(String, nullable=True)

    # Customer / fulfillment details
    customer_name = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    shipping_address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    accepted_terms = Column(Boolean, nullable=False, default=False)
    accepted_terms_at = Column(DateTime(timezone=True), nullable=True)

    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = uuid_pk()
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    title = Column(String, nullable=False)
    unit_price_cents = Column(Integer, nullable=False, default=0)
    quantity = Column(Integer, nullable=False, default=1)

    order = relationship("Order", back_populates="items")


class Review(TimestampMixin, Base):
    """Client testimonial; prompted a day after the appointment, healed-update later."""

    __tablename__ = "reviews"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    author_user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    appointment_id = Column(
        UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True
    )
    title = Column(String, nullable=True)
    body = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)
    images = Column(JSONB, nullable=True)
    healed_update_at = Column(DateTime(timezone=True), nullable=True)
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True)
    published = Column(Boolean, nullable=False, default=False)
