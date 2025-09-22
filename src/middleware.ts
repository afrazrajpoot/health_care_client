// middleware.ts
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

    // Check if token is expired
    if (token.exp && token.exp < now) return redirectToSignIn(req);

    // Allow access to protected routes for authenticated users
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
    "/dashboard/:path*",
    "/patients/:path*",
    "/documents/:path*",
    "/tasks/:path*",
    "/upload-doc/:path*",
  ],
};
