"""Extra auth endpoints beyond fastapi-users built-ins:

- Email 6-digit verification codes (request / confirm)
- Password login that branches to a 2FA challenge when TOTP is enabled
- TOTP enroll / enable / disable

All sensitive endpoints are rate limited. Identity-revealing responses are kept
uniform (always 200 on request-code) to avoid account enumeration.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi_users.exceptions import UserNotExists
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_async_session
from app.models import User
from app.ratelimit import limiter
from app.schemas import (
    EmailCodeConfirm,
    EmailCodeRequest,
    LoginRequest,
    LoginResult,
    MessageResponse,
    TotpEnrollResponse,
    TotpVerifyRequest,
    TwoFactorLoginRequest,
)
from app.services.security import (
    make_preauth_token,
    new_totp_secret,
    totp_provisioning_uri,
    totp_qr_svg,
    verify_preauth_token,
    verify_totp,
)
from app.services.verification import confirm_email_code, issue_email_code
from app.users import UserManager, current_active_user, get_jwt_strategy, get_user_manager

router = APIRouter(tags=["auth"])


class _Credentials:
    """Minimal shim for UserManager.authenticate (it only reads username/password)."""

    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password


@router.post("/request-verification-code", response_model=MessageResponse)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def request_verification_code(
    request: Request,
    payload: EmailCodeRequest,
    session: AsyncSession = Depends(get_async_session),
    user_manager: UserManager = Depends(get_user_manager),
):
    try:
        user = await user_manager.get_by_email(payload.email)
        if not user.is_verified:
            await issue_email_code(session, user)
    except UserNotExists:
        pass  # uniform response to avoid enumeration
    return {"message": "If that account exists, a verification code has been sent."}


@router.post("/confirm-verification-code", response_model=MessageResponse)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def confirm_verification_code(
    request: Request,
    payload: EmailCodeConfirm,
    session: AsyncSession = Depends(get_async_session),
    user_manager: UserManager = Depends(get_user_manager),
):
    try:
        user = await user_manager.get_by_email(payload.email)
    except UserNotExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code."
        )
    if not await confirm_email_code(session, user, payload.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code.",
        )
    user.is_verified = True
    await session.commit()
    return {"message": "Email verified."}


@router.post("/login", response_model=LoginResult)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def login(
    request: Request,
    payload: LoginRequest,
    user_manager: UserManager = Depends(get_user_manager),
):
    user = await user_manager.authenticate(
        _Credentials(payload.email, payload.password)
    )
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid credentials.",
        )
    if user.totp_enabled:
        return LoginResult(
            requires_2fa=True, preauth_token=make_preauth_token(str(user.id))
        )
    token = await get_jwt_strategy().write_token(user)
    return LoginResult(access_token=token)


@router.post("/2fa/login", response_model=LoginResult)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def two_factor_login(
    request: Request,
    payload: TwoFactorLoginRequest,
    session: AsyncSession = Depends(get_async_session),
):
    user_id = verify_preauth_token(payload.preauth_token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expired or invalid 2FA session. Please log in again.",
        )
    user = (
        await session.execute(select(User).where(User.id == uuid.UUID(user_id)))
    ).scalars().first()
    if user is None or not user.totp_enabled or not user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA session."
        )
    if not verify_totp(user.totp_secret, payload.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authentication code.",
        )
    token = await get_jwt_strategy().write_token(user)
    return LoginResult(access_token=token)


@router.post("/2fa/enroll", response_model=TotpEnrollResponse)
async def enroll_totp(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    secret = new_totp_secret()
    user.totp_secret = secret
    user.totp_enabled = False  # not active until verified
    await session.commit()
    uri = totp_provisioning_uri(secret, user.email)
    return TotpEnrollResponse(secret=secret, otpauth_uri=uri, qr_svg=totp_qr_svg(uri))


@router.post("/2fa/enable", response_model=MessageResponse)
async def enable_totp(
    payload: TotpVerifyRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    if not user.totp_secret or not verify_totp(user.totp_secret, payload.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authentication code.",
        )
    user.totp_enabled = True
    await session.commit()
    return {"message": "Two-factor authentication enabled."}


@router.post("/2fa/disable", response_model=MessageResponse)
async def disable_totp(
    payload: TotpVerifyRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    if not user.totp_enabled or not user.totp_secret or not verify_totp(
        user.totp_secret, payload.code
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authentication code.",
        )
    user.totp_enabled = False
    user.totp_secret = None
    await session.commit()
    return {"message": "Two-factor authentication disabled."}
