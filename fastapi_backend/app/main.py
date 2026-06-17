from fastapi import FastAPI
from fastapi_pagination import add_pagination
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .schemas import UserCreate, UserRead, UserUpdate
from .users import auth_backend, fastapi_users, AUTH_URL_PATH
from fastapi.middleware.cors import CORSMiddleware
from .utils import simple_generate_unique_route_id
from .ratelimit import limiter
from app.routes.items import router as items_router
from app.routes.auth_extra import router as auth_extra_router
from app.routes.availability import router as availability_router
from app.routes.appointments import router as appointments_router
from app.routes.contacts import router as contacts_router
from app.routes.profile import router as profile_router
from app.routes.public_booking import router as public_booking_router
from app.routes.clerk import router as clerk_router
from app.routes.uploads import router as uploads_router
from app.routes.portfolio import router as portfolio_router
from app.routes.flash import router as flash_router
from app.routes.products import router as products_router
from app.routes.booking_page import router as booking_page_router
from app.routes.campaigns import router as campaigns_router
from app.routes.issues import router as issues_router
from app.config import settings
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI(
    generate_unique_id_function=simple_generate_unique_route_id,
    openapi_url=settings.OPENAPI_URL,
)

# Rate limiting (slowapi)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware for CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication and user management routes
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix=f"/{AUTH_URL_PATH}/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix=f"/{AUTH_URL_PATH}",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix=f"/{AUTH_URL_PATH}",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix=f"/{AUTH_URL_PATH}",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# Extra auth (email codes, 2FA, 2-step login)
app.include_router(auth_extra_router, prefix=f"/{AUTH_URL_PATH}", tags=["auth"])

# FlashBook domain routes
app.include_router(availability_router, prefix="/availability", tags=["availability"])
app.include_router(appointments_router, prefix="/appointments", tags=["appointments"])
app.include_router(contacts_router, prefix="/contacts", tags=["contacts"])
app.include_router(profile_router, prefix="/profile", tags=["profile"])
app.include_router(public_booking_router, prefix="/public", tags=["public"])
app.include_router(clerk_router, prefix="/clerk", tags=["clerk"])
app.include_router(uploads_router, prefix="/uploads", tags=["uploads"])
app.include_router(portfolio_router, prefix="/portfolio", tags=["portfolio"])
app.include_router(flash_router, prefix="/flash", tags=["flash"])
app.include_router(products_router, prefix="/products", tags=["products"])
app.include_router(booking_page_router, prefix="/booking-page", tags=["booking-page"])
app.include_router(campaigns_router, prefix="/campaigns", tags=["campaigns"])
app.include_router(issues_router, prefix="/issues", tags=["issues"])

# Serve locally-stored uploads in dev (no-op semantics in prod when using R2).
_media_dir = Path(settings.MEDIA_DIR)
_media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(_media_dir)), name="media")

# Include items routes
app.include_router(items_router, prefix="/items")
add_pagination(app)
