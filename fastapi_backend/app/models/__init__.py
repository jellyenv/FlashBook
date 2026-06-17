"""FlashBook ORM models.

Re-exports every model so `from app.models import Base, User, ...` keeps working
and Alembic's `Base.metadata` sees all tables for autogenerate.
"""

from .base import Base, TimestampMixin, str_enum, uuid_pk
from .enums import (
    AppointmentSource,
    AppointmentStatus,
    AvailabilityExceptionType,
    ButtonShape,
    CampaignStatus,
    ColorType,
    ConversationType,
    DepositStatus,
    FlashStatus,
    MessageChannel,
    PaymentKind,
    PaymentMethodType,
    PaymentStatus,
    PromoAppliesTo,
    PromoType,
    SubscriptionPlan,
    UserRole,
)
from .user import (
    ArtistProfile,
    AssistantGrant,
    ClientProfile,
    Contact,
    EmailVerificationCode,
    User,
)
from .item import Item
from .scheduling import (
    Appointment,
    ArtistGroup,
    ArtistGroupMember,
    AvailabilityException,
    AvailabilityRule,
    Booth,
    BoothMember,
)
from .commerce import (
    Cart,
    CartItem,
    FlashPiece,
    Order,
    OrderItem,
    PortfolioImage,
    Product,
    Review,
)
from .payments import (
    ConnectAccount,
    Payment,
    PaymentMethod,
    PromoCode,
    Subscription,
)
from .messaging import (
    Campaign,
    Conversation,
    ConversationParticipant,
    Message,
)
from .customization import (
    ArtistAssetPurchase,
    BookingPageLayout,
    CosmeticAsset,
    ThemeSettings,
)
from .notifications import (
    AuditLog,
    IssueReport,
    Notification,
    NotificationPreference,
    SignedWaiver,
    Waiver,
)

__all__ = [
    "Base",
    "TimestampMixin",
    "str_enum",
    "uuid_pk",
    # enums
    "AppointmentSource",
    "AppointmentStatus",
    "AvailabilityExceptionType",
    "ButtonShape",
    "CampaignStatus",
    "ColorType",
    "ConversationType",
    "DepositStatus",
    "FlashStatus",
    "MessageChannel",
    "PaymentKind",
    "PaymentMethodType",
    "PaymentStatus",
    "PromoAppliesTo",
    "PromoType",
    "SubscriptionPlan",
    "UserRole",
    # identity
    "User",
    "ArtistProfile",
    "ClientProfile",
    "Contact",
    "AssistantGrant",
    "EmailVerificationCode",
    "Item",
    # scheduling
    "Appointment",
    "ArtistGroup",
    "ArtistGroupMember",
    "AvailabilityException",
    "AvailabilityRule",
    "Booth",
    "BoothMember",
    # commerce
    "Cart",
    "CartItem",
    "FlashPiece",
    "Order",
    "OrderItem",
    "PortfolioImage",
    "Product",
    "Review",
    # payments
    "ConnectAccount",
    "Payment",
    "PaymentMethod",
    "PromoCode",
    "Subscription",
    # messaging
    "Campaign",
    "Conversation",
    "ConversationParticipant",
    "Message",
    # customization
    "ArtistAssetPurchase",
    "BookingPageLayout",
    "CosmeticAsset",
    "ThemeSettings",
    # notifications / compliance
    "AuditLog",
    "IssueReport",
    "Notification",
    "NotificationPreference",
    "SignedWaiver",
    "Waiver",
]
