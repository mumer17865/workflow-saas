import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Coarse gate for the authenticated area: if there is no refresh cookie at all,
 * bounce to /login before rendering. Real validation happens in the API and in
 * the client AuthProvider — this only avoids flashing protected pages.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("refresh_token");
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
