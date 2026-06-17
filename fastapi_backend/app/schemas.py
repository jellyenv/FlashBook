import uuid

from fastapi_users import schemas
from pydantic import BaseModel, EmailStr
from uuid import UUID

from app.models.enums import UserRole


class UserRead(schemas.BaseUser[uuid.UUID]):
    role: UserRole = UserRole.client
    full_name: str | None = None
    phone: str | None = None
    totp_enabled: bool = False


class UserCreate(schemas.BaseUserCreate):
    role: UserRole = UserRole.client
    full_name: str | None = None
    phone: str | None = None


class UserUpdate(schemas.BaseUserUpdate):
    full_name: str | None = None
    phone: str | None = None


# --- Auth: email verification codes & two-factor ---


class EmailCodeRequest(BaseModel):
    email: EmailStr


class EmailCodeConfirm(BaseModel):
    email: EmailStr
    code: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResult(BaseModel):
    """Either a real bearer token, or a 2FA challenge with a short-lived preauth token."""

    requires_2fa: bool = False
    preauth_token: str | None = None
    access_token: str | None = None
    token_type: str = "bearer"


class TwoFactorLoginRequest(BaseModel):
    preauth_token: str
    code: str


class TotpEnrollResponse(BaseModel):
    secret: str
    otpauth_uri: str
    qr_svg: str


class TotpVerifyRequest(BaseModel):
    code: str


class MessageResponse(BaseModel):
    message: str


# --- Demo item resource (template) ---


class ItemBase(BaseModel):
    name: str
    description: str | None = None
    quantity: int | None = None


class ItemCreate(ItemBase):
    pass


class ItemRead(ItemBase):
    id: UUID
    user_id: UUID

    model_config = {"from_attributes": True}
