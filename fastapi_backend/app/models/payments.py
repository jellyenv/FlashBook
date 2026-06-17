"""Payments: Stripe Connect accounts, cards-on-file, payments (card + cash),
subscriptions, promo codes."""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import UUID

from .base import Base, TimestampMixin, str_enum, uuid_pk
from .enums import (
    PaymentKind,
    PaymentMethodType,
    PaymentStatus,
    PromoAppliesTo,
    PromoType,
    SubscriptionPlan,
)


class ConnectAccount(TimestampMixin, Base):
    __tablename__ = "connect_accounts"

    id = uuid_pk()
    artist_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, unique=True
    )
    stripe_account_id = Column(String, nullable=False)
    charges_enabled = Column(Boolean, nullable=False, default=False)
    payouts_enabled = Column(Boolean, nullable=False, default=False)


class PaymentMethod(TimestampMixin, Base):
    """Card-on-file reference only — never store raw PANs (PCI via Stripe)."""

    __tablename__ = "payment_methods"

    id = uuid_pk()
    client_user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    stripe_customer_id = Column(String, nullable=False)
    stripe_pm_id = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    last4 = Column(String, nullable=True)


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    appointment_id = Column(
        UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True
    )
    amount_cents = Column(Integer, nullable=False, default=0)
    kind = Column(str_enum(PaymentKind), nullable=False)
    method = Column(
        str_enum(PaymentMethodType), nullable=False, default=PaymentMethodType.card.value
    )
    status = Column(
        str_enum(PaymentStatus), nullable=False, default=PaymentStatus.pending.value
    )
    stripe_payment_intent_id = Column(String, nullable=True)
    # For cash entries: who recorded it (artist/assistant), surfaced in Payment History.
    recorded_by = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    note = Column(String, nullable=True)


class Subscription(TimestampMixin, Base):
    __tablename__ = "subscriptions"

    id = uuid_pk()
    artist_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, unique=True
    )
    plan = Column(str_enum(SubscriptionPlan), nullable=False)
    stripe_subscription_id = Column(String, nullable=True)
    status = Column(String, nullable=False, default="inactive")
    current_period_end = Column(DateTime(timezone=True), nullable=True)


class PromoCode(TimestampMixin, Base):
    __tablename__ = "promo_codes"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    code = Column(String, nullable=False, index=True)
    type = Column(str_enum(PromoType), nullable=False)
    value = Column(Integer, nullable=False)  # percent (0-100) or fixed cents
    applies_to = Column(
        str_enum(PromoAppliesTo), nullable=False, default=PromoAppliesTo.both.value
    )
    usage_limit = Column(Integer, nullable=True)
    times_used = Column(Integer, nullable=False, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    active = Column(Boolean, nullable=False, default=True)
