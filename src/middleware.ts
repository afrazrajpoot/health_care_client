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

    // ✅ Physician-only routes
    if (
      (pathname.startsWith("/add-staff") || pathname.startsWith("/tasks")) &&
      token.role !== "Physician"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // ✅ Staff-only routes
    if (
      (pathname.startsWith("/upload") ||
        pathname.startsWith("/documents") ||
        pathname.startsWith("/tasks")) &&
      token.role !== "Staff"
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
  ],
};
