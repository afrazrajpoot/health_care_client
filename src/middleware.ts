// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

function redirectToSignIn(req: Request) {
  return NextResponse.redirect(new URL("/auth/sign-in", req.url));
}

export default withAuth((req) => {
  const token: any = (req as any).nextauth?.token;
 
  if (!token) return redirectToSignIn(req);

  const now = Math.floor(Date.now() / 1000);

  // Check if token is expired
  if (token.exp && token.exp < now) return redirectToSignIn(req);

  // Check if refresh token is expired (if you have refresh token logic)
  if (token.refreshExpiresAt && token.refreshExpiresAt < now)
    return redirectToSignIn(req);

  // Role-based route protection
  if (req.nextUrl.pathname.startsWith("/physician-dashboard") && token.role !== "Physician") {
    return NextResponse.redirect(new URL("/staff-dashboard", req.url));
  }

  if (req.nextUrl.pathname.startsWith("/staff-dashboard") && token.role !== "Staff") {
    return NextResponse.redirect(new URL("/physician-dashboard", req.url));
  }

  // Optional: Redirect to appropriate dashboard based on role when accessing root
  if (req.nextUrl.pathname === "/dashboard") {
    if (token.role === "Physician") {
      return NextResponse.redirect(new URL("/physician-dashboard", req.url));
    } else if (token.role === "Staff") {
      return NextResponse.redirect(new URL("/staff-dashboard", req.url));
    }
  }

  return NextResponse.next();
}, {
  pages: {
    signIn: "/auth/sign-in",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/physician-dashboard/:path*",
    "/physician-dashboard",
    "/staff-dashboard/:path*",
    "/staff-dashboard",
  ],
};