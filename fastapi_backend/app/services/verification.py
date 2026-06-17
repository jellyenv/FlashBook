"""Issue and confirm 6-digit email verification codes."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.email import send_verification_code_email
from app.models import EmailVerificationCode, User
from app.services.security import generate_numeric_code, hash_code, verify_code

MAX_ATTEMPTS = 5


async def issue_email_code(session: AsyncSession, user: User) -> None:
    """Create a fresh code for the user and email it. Old unconsumed codes are dropped."""
    now = datetime.now(timezone.utc)
    code = generate_numeric_code(6)
    session.add(
        EmailVerificationCode(
            user_id=user.id,
            code_hash=hash_code(code),
            expires_at=now + timedelta(seconds=settings.EMAIL_CODE_EXPIRE_SECONDS),
            created_at=now,
        )
    )
    await session.commit()
    await send_verification_code_email(user.email, code)


async def confirm_email_code(session: AsyncSession, user: User, code: str) -> bool:
    """Validate the most recent code for the user; mark it consumed on success."""
    now = datetime.now(timezone.utc)
    result = await session.execute(
        select(EmailVerificationCode)
        .where(
            EmailVerificationCode.user_id == user.id,
            EmailVerificationCode.consumed_at.is_(None),
        )
        .order_by(EmailVerificationCode.created_at.desc())
    )
    record = result.scalars().first()
    if record is None:
        return False
    if record.expires_at < now or record.attempts >= MAX_ATTEMPTS:
        return False

    record.attempts += 1
    if not verify_code(code, record.code_hash):
        await session.commit()
        return False

    record.consumed_at = now
    await session.commit()
    return True
