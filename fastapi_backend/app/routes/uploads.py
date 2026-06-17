"""Authenticated image upload: validate, strip EXIF, store (R2/S3 or local)."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.domain_schemas import UploadResponse
from app.models import User
from app.services.clerk_auth import get_clerk_user
from app.services.images import ImageError, process_image
from app.services.storage import get_storage

router = APIRouter()


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(get_clerk_user),
):
    raw = await file.read()
    try:
        data, ext, content_type = process_image(raw, file.content_type)
    except ImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    url = get_storage().save(data, ext, content_type)
    return UploadResponse(url=url)
