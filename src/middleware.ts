import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-change-me"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // /manage/warning* routes allow both admin and super_admin
    const warningPaths = ["/manage/warning-types", "/manage/warnings"];
    const isWarningPath = warningPaths.some((p) =>
      request.nextUrl.pathname.startsWith(p)
    );

    if (request.nextUrl.pathname.startsWith("/manage")) {
      if (isWarningPath) {
        // Warning pages accessible by both admin and super_admin
        if (role !== "super_admin" && role !== "admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } else {
        // Other /manage/* routes require super_admin
        if (role !== "super_admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }

    // /students routes allow both super_admin and admin
    if (request.nextUrl.pathname.startsWith("/students")) {
      if (role !== "super_admin" && role !== "admin") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/manage/:path*", "/students/:path*"],
};
