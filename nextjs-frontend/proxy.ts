import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes: landing, public booking pages, and the Clerk auth pages.
const isPublicRoute = createRouteMatcher([
  "/",
  "/book(.*)",
  "/studio/login(.*)",
  "/studio/register(.*)",
  "/sso-callback(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes and Clerk's auto-proxy path
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
