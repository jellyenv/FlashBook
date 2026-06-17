"""String-backed enums for FlashBook.

Stored as VARCHAR (native_enum=False at the column) so Alembic autogenerate stays
simple and we avoid Postgres native enum migration friction, while still validating
values at the ORM/schema layer.
"""

from enum import Enum


class UserRole(str, Enum):
    artist = "artist"
    client = "client"


class AppointmentStatus(str, Enum):
    requested = "requested"
    under_review = "under_review"
    confirmed = "confirmed"
    declined = "declined"
    cancelled = "cancelled"
    completed = "completed"
    no_show = "no_show"


class AppointmentSource(str, Enum):
    artist_manual = "artist_manual"
    client_booking = "client_booking"


class ColorType(str, Enum):
    color = "color"
    black_and_grey = "black_and_grey"


class AvailabilityExceptionType(str, Enum):
    custom_hours = "custom_hours"
    closed = "closed"


class DepositStatus(str, Enum):
    none = "none"
    pending = "pending"
    authorized = "authorized"
    paid = "paid"
    refunded = "refunded"
    failed = "failed"


class PaymentKind(str, Enum):
    deposit = "deposit"
    balance = "balance"
    day_of = "day_of"


class PaymentMethodType(str, Enum):
    card = "card"
    cash = "cash"


class PaymentStatus(str, Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"


class SubscriptionPlan(str, Enum):
    monthly = "monthly"
    annual = "annual"


class PromoType(str, Enum):
    percent = "percent"
    fixed = "fixed"


class PromoAppliesTo(str, Enum):
    booking = "booking"
    merch = "merch"
    both = "both"


class FlashStatus(str, Enum):
    available = "available"
    claimed = "claimed"


class ConversationType(str, Enum):
    artist_client = "artist_client"
    dm = "dm"
    shop_group = "shop_group"


class MessageChannel(str, Enum):
    in_app = "in_app"
    sms = "sms"
    email = "email"


class CampaignStatus(str, Enum):
    draft = "draft"
    scheduled = "scheduled"
    sending = "sending"
    sent = "sent"


class ButtonShape(str, Enum):
    rounded = "rounded"
    sharp = "sharp"
