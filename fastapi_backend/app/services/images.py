"""Validate and normalize uploaded images: enforce type/size, strip EXIF, downscale."""

import io

from PIL import Image

ALLOWED: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_DIM = 2400  # px, longest side


class ImageError(ValueError):
    pass


def process_image(raw: bytes, content_type: str | None) -> tuple[bytes, str, str]:
    """Return (clean_bytes, extension, content_type) or raise ImageError.

    Re-encoding strips EXIF/metadata (privacy) and bounds dimensions. Animated GIFs
    are passed through unchanged to preserve animation.
    """
    if content_type not in ALLOWED:
        raise ImageError("Unsupported image type. Use JPEG, PNG, WebP, or GIF.")
    if len(raw) > MAX_BYTES:
        raise ImageError("Image is too large (max 10 MB).")

    try:
        Image.open(io.BytesIO(raw)).verify()
        img = Image.open(io.BytesIO(raw))
    except Exception as exc:  # noqa: BLE001
        raise ImageError("That file isn't a valid image.") from exc

    ext = ALLOWED[content_type]
    if content_type == "image/gif":
        return raw, ext, content_type

    fmt = {"image/png": "PNG", "image/webp": "WEBP", "image/jpeg": "JPEG"}[content_type]
    img = img.convert("RGBA" if content_type == "image/png" else "RGB")
    img.thumbnail((MAX_DIM, MAX_DIM))

    out = io.BytesIO()
    if fmt == "JPEG":
        img.save(out, format=fmt, optimize=True, quality=85)
    elif fmt == "WEBP":
        img.save(out, format=fmt, quality=85, method=4)
    else:
        img.save(out, format=fmt, optimize=True)
    return out.getvalue(), ext, content_type
