"""Public issue/bug reporting. Generates an incident code, logs it for matching,
and stores the report."""

import logging
import secrets

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_async_session
from app.domain_schemas import IssueReportCreate, IssueReportResult
from app.models import IssueReport
from app.ratelimit import limiter

router = APIRouter()

logger = logging.getLogger("flashbook.issues")

# Crockford-ish alphabet (no ambiguous chars) for human-readable incident codes.
_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def _incident_code() -> str:
    return "FB-" + "".join(secrets.choice(_ALPHABET) for _ in range(6))


@router.post("/", response_model=IssueReportResult)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def report_issue(
    request: Request,
    payload: IssueReportCreate,
    db: AsyncSession = Depends(get_async_session),
):
    code = _incident_code()
    user_agent = request.headers.get("user-agent")
    role = payload.role or "anonymous"

    report = IssueReport(
        incident_code=code,
        reporter_role=role,
        reporter_email=payload.email,
        page=payload.page,
        message=payload.message,
        user_agent=user_agent,
        status="open",
    )
    db.add(report)
    await db.commit()

    # Written to the server log so a reported incident code can be matched to logs.
    logger.warning(
        "ISSUE_REPORT incident=%s role=%s page=%s email=%s message=%r",
        code,
        role,
        payload.page,
        payload.email,
        payload.message[:1000],
    )

    return IssueReportResult(
        incident_code=code,
        message="Thanks for the report! Reference this ID if you follow up.",
    )
