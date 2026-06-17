"""Pluggable image storage: Cloudflare R2 / S3 when configured, else local disk.

Local files are written under MEDIA_DIR (mounted via the shared-data volume) and
served by FastAPI at /media, so uploads work in dev without any cloud credentials.
"""

from pathlib import Path
from uuid import uuid4

from app.config import settings


class Storage:
    def save(self, data: bytes, ext: str, content_type: str) -> str:  # pragma: no cover
        raise NotImplementedError


class S3Storage(Storage):
    """Cloudflare R2 (or any S3-compatible) object storage via boto3."""

    def __init__(self) -> None:
        import boto3

        self._client = boto3.client(
            "s3",
            endpoint_url=settings.STORAGE_ENDPOINT_URL,
            region_name=settings.STORAGE_REGION,
            aws_access_key_id=settings.STORAGE_ACCESS_KEY_ID,
            aws_secret_access_key=settings.STORAGE_SECRET_ACCESS_KEY,
        )

    def save(self, data: bytes, ext: str, content_type: str) -> str:
        key = f"uploads/{uuid4().hex}.{ext}"
        self._client.put_object(
            Bucket=settings.STORAGE_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type,
            CacheControl="public, max-age=31536000, immutable",
        )
        base = (settings.STORAGE_PUBLIC_BASE_URL or "").rstrip("/")
        return f"{base}/{key}"


class LocalStorage(Storage):
    def __init__(self) -> None:
        self._dir = Path(settings.MEDIA_DIR)
        self._dir.mkdir(parents=True, exist_ok=True)

    def save(self, data: bytes, ext: str, content_type: str) -> str:
        name = f"{uuid4().hex}.{ext}"
        (self._dir / name).write_bytes(data)
        return f"{settings.MEDIA_BASE_URL.rstrip('/')}/{name}"


def get_storage() -> Storage:
    if settings.STORAGE_BUCKET and settings.STORAGE_ACCESS_KEY_ID:
        return S3Storage()
    return LocalStorage()
