"""Messaging & campaigns: conversations, participants, messages, campaigns."""

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin, str_enum, uuid_pk
from .enums import CampaignStatus, ConversationType, MessageChannel


class Conversation(TimestampMixin, Base):
    __tablename__ = "conversations"

    id = uuid_pk()
    type = Column(str_enum(ConversationType), nullable=False)
    # Owning artist (for artist_client / shop_group threads)
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    title = Column(String, nullable=True)

    participants = relationship(
        "ConversationParticipant",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan"
    )


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id = uuid_pk()
    conversation_id = Column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)

    conversation = relationship("Conversation", back_populates="participants")


class Message(TimestampMixin, Base):
    __tablename__ = "messages"

    id = uuid_pk()
    conversation_id = Column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False
    )
    sender_user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    body = Column(Text, nullable=False)
    channel = Column(
        str_enum(MessageChannel), nullable=False, default=MessageChannel.in_app.value
    )
    read_at = Column(DateTime(timezone=True), nullable=True)

    conversation = relationship("Conversation", back_populates="messages")


class Campaign(TimestampMixin, Base):
    __tablename__ = "campaigns"

    id = uuid_pk()
    artist_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    link = Column(String, nullable=True)
    audience = Column(JSONB, nullable=True)  # filter definition
    channel = Column(
        str_enum(MessageChannel), nullable=False, default=MessageChannel.email.value
    )
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        str_enum(CampaignStatus), nullable=False, default=CampaignStatus.draft.value
    )
