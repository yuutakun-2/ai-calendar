import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isPublicAuthPath = pathname === "/login" || pathname === "/register";
  const isDashboardPath = pathname.startsWith("/dashboard");
  const isApiPath =
    pathname.startsWith("/api/exams") || pathname.startsWith("/api/ai");
  const isRoot = pathname === "/";

  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);

      // User is authenticated
      if (isPublicAuthPath || isRoot) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.next();
    } catch (error) {
      // Token invalid
      if (isDashboardPath || isApiPath) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  } else {
    // No token
    if (isDashboardPath || isApiPath || isRoot) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/api/exams/:path*",
    "/api/ai/:path*",
  ],
};
