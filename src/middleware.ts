import { NextResponse, type NextRequest } from "next/server";

import { getToken, type JWT } from "next-auth/jwt";

import { getPostAuthRedirectPath } from "@/lib/auth-session";
import { USER_ROLES } from "@/lib/types";

function applyActiveBrandCookie(response: NextResponse, request: NextRequest, token: JWT, isProtectedRoute: boolean) {
  if (!isProtectedRoute) return;

  const activeBrandId = request.cookies.get("active_brand_id")?.value;
  const defaultBrandId = (token as { defaultBrandId?: string }).defaultBrandId;
  if (!activeBrandId && defaultBrandId && defaultBrandId !== "ALL") {
    response.cookies.set("active_brand_id", defaultBrandId, { path: "/" });
  }
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Get the JWT token to check authentication and role
  const token = await getToken({ req: request });

  const isLoggedIn = !!token;

  // Check if the user is trying to access a protected route
  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");

  // Check if the user is trying to access auth pages
  const isAuthPage = nextUrl.pathname.startsWith("/sign-in") || nextUrl.pathname.startsWith("/sign-up");

  // Redirect logged-in users away from auth pages (respect role; never send members to dashboard)
  if (isLoggedIn && isAuthPage) {
    const callbackUrl = nextUrl.searchParams.get("callbackUrl");
    const redirectPath = getPostAuthRedirectPath(String(token.role), callbackUrl);
    return NextResponse.redirect(new URL(redirectPath, nextUrl));
  }

  // Redirect unauthenticated users to sign-in page
  if (!isLoggedIn && isProtectedRoute) {
    const callbackUrl = nextUrl.pathname + nextUrl.search;
    return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl));
  }

  // Members use /public only — block direct navigation or stale sessions hitting /dashboard
  if (isLoggedIn && isProtectedRoute && token.role === USER_ROLES.MEMBER) {
    return NextResponse.redirect(new URL("/public", nextUrl));
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", nextUrl.pathname);
  if (isLoggedIn && isProtectedRoute) {
    applyActiveBrandCookie(response, request, token, true);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
