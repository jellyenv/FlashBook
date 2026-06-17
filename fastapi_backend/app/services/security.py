"""Security primitives: email verification codes, short-lived preauth tokens
(for the 2FA login step), and TOTP helpers.

Self-contained HMAC signing is used for the preauth token so we don't depend on a
particular JWT library beyond what fastapi-users already provides for the real
access token.
"""

import base64
import hashlib
import hmac
import json
import secrets
import time

import pyotp
import qrcode
import qrcode.image.svg

from app.config import settings


# --- Email verification codes ---


def generate_numeric_code(length: int = 6) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))


def hash_code(code: str) -> str:
    """HMAC-SHA256 of a numeric code, keyed by the verification secret."""
    return hmac.new(
        settings.VERIFICATION_SECRET_KEY.encode(),
        code.encode(),
        hashlib.sha256,
    ).hexdigest()


def verify_code(code: str, code_hash: str) -> bool:
    return hmac.compare_digest(hash_code(code), code_hash)


# --- Short-lived preauth token (HMAC-signed) for the 2FA login step ---


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64d(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def make_preauth_token(user_id: str) -> str:
    payload = {
        "sub": str(user_id),
        "exp": int(time.time()) + settings.PREAUTH_TOKEN_EXPIRE_SECONDS,
        "scope": "preauth",
    }
    body = _b64e(json.dumps(payload, separators=(",", ":")).encode())
    sig = hmac.new(
        settings.PREAUTH_SECRET_KEY.encode(), body.encode(), hashlib.sha256
    ).digest()
    return f"{body}.{_b64e(sig)}"


def verify_preauth_token(token: str) -> str | None:
    """Return the user id if the token is valid and unexpired, else None."""
    try:
        body, sig = token.split(".", 1)
    except ValueError:
        return None
    expected = hmac.new(
        settings.PREAUTH_SECRET_KEY.encode(), body.encode(), hashlib.sha256
    ).digest()
    if not hmac.compare_digest(_b64e(expected), sig):
        return None
    try:
        payload = json.loads(_b64d(body))
    except (ValueError, json.JSONDecodeError):
        return None
    if payload.get("scope") != "preauth":
        return None
    if int(payload.get("exp", 0)) < int(time.time()):
        return None
    return payload.get("sub")


# --- TOTP (2FA) ---


def new_totp_secret() -> str:
    return pyotp.random_base32()


def totp_provisioning_uri(secret: str, account_name: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(
        name=account_name, issuer_name=settings.TOTP_ISSUER
    )


def verify_totp(secret: str, code: str) -> bool:
    return pyotp.TOTP(secret).verify(code, valid_window=1)


def totp_qr_svg(otpauth_uri: str) -> str:
    """Render the otpauth URI as an inline SVG QR code string."""
    factory = qrcode.image.svg.SvgPathImage
    img = qrcode.make(otpauth_uri, image_factory=factory)
    return img.to_string(encoding="unicode")
