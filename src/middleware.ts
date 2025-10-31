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

    // ✅ If Attorney visits /dashboard → redirect them to attorney dashboard
    if (pathname.startsWith("/dashboard") && token.role === "Attorney") {
      return NextResponse.redirect(new URL("/attorney-dashboard", req.url));
    }

    // ✅ Allow Physician and Staff to access both dashboards
    if (
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/staff-dashboard")) &&
      (token.role === "Physician" || token.role === "Staff")
    ) {
      return NextResponse.next();
    }

    // ✅ Restrict /attorney-dashboard to Attorneys only
    if (
      (pathname === "/attorney-dashboard" ||
        pathname.startsWith("/attorney-dashboard")) &&
      token.role !== "Attorney"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // ✅ Staff & Physician shared routes
    if (
      (pathname.startsWith("/upload") ||
        pathname.startsWith("/documents") ||
        pathname.startsWith("/tasks")) &&
      !(token.role === "Physician" || token.role === "Staff")
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
