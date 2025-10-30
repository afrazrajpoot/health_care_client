import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

function redirectToSignIn(req: Request) {
  return NextResponse.redirect(new URL("/auth/sign-in", req.url));
}

export default withAuth(
  (req) => {
    const token: any = (req as any).nextauth?.token;
    if (!token) return redirectToSignIn(req);

    const now = Math.floor(Date.now() / 1000);

    // 🔐 Token expiration checks
    if (token.exp && token.exp < now) return redirectToSignIn(req);
    if (token.refreshExpiresAt && token.refreshExpiresAt < now)
      return redirectToSignIn(req);

    const pathname = req.nextUrl.pathname;

    // ✅ If Staff visits /dashboard → redirect them to /staff-dashboard
    if (pathname.startsWith("/dashboard") && token.role === "Staff") {
      return NextResponse.redirect(new URL("/staff-dashboard", req.url));
    }

    // ✅ If Attorney visits /dashboard → redirect them to /attorney-dashboard
    if (pathname.startsWith("/dashboard") && token.role === "Attorney") {
      return NextResponse.redirect(new URL("/attorney-dashboard", req.url));
    }

    // ✅ Staff-only routes (allowed only for Staff)
    if (
      (pathname.startsWith("/upload") ||
        pathname.startsWith("/documents") ||
        pathname.startsWith("/tasks") ||
        pathname.startsWith("/staff-dashboard")) &&
      token.role !== "Staff"
    ) {
      // ❗ Allow Physician to access staff-dashboard if needed
      if (token.role === "Physician" && pathname.startsWith("/staff-dashboard")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // ✅ Attorney-only routes
    if (
      (pathname === "/attorney-dashboard" ||
        pathname.startsWith("/attorney-dashboard")) &&
      token.role !== "Attorney"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/auth/sign-in",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/tasks",
    "/tasks/:path*",
    "/add-staff",
    "/add-staff/:path*",
    "/upload",
    "/upload/:path*",
    "/documents",
    "/documents/:path*",
    "/staff-dashboard",
    "/staff-dashboard/:path*",
    "/attorney-dashboard",
    "/attorney-dashboard/:path*",
  ],
};
