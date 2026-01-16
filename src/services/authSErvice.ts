import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      firstName?: string;
      lastName?: string;
      physicianId?: string | null;
      fastapi_token?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    physicianId?: string | null;
    fastapi_token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    physicianId?: string | null;
    fastapi_token?: string;
  }
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const SYNC_SECRET = process.env.SYNC_SECRET;

if (!SYNC_SECRET) {
  console.warn("⚠️ SYNC_SECRET environment variable is not set!");
} else {
  console.log("✅ SYNC_SECRET is configured");
}

async function syncWithFastAPI(
  userId: string,
  userEmail: string
): Promise<string> {
  try {
    console.log("🔄 Attempting to sync with FastAPI...");

    if (!SYNC_SECRET) {
      throw new Error("SYNC_SECRET environment variable is not set");
    }

    const response = await fetch(`${FASTAPI_URL}/api/auth/sync-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        user_email: userEmail,
        sync_token: SYNC_SECRET,
      }),
    });

    console.log(`📨 FastAPI response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ FastAPI sync failed: ${response.status} - ${errorText}`
      );
      throw new Error(`FastAPI sync failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Successfully synced with FastAPI");
    return data.access_token;
  } catch (error) {
    console.error("❌ Failed to sync with FastAPI:", error);
    throw error;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        console.log(`🔐 Login attempt for: ${credentials.email}`);

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          console.log("❌ User not found");
          throw new Error("Invalid email or password");
        }

        if (!user.password) {
          console.log("❌ User has no password set");
          throw new Error("Account not set up for password login");
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) {
          console.log("❌ Invalid password");
          throw new Error("Invalid email or password");
        }

        console.log(`✅ Password validated for user: ${user.id}`);

        // ✅ AUTOMATICALLY SYNC WITH FASTAPI
        let fastapiToken: string = "";
        try {
          fastapiToken = await syncWithFastAPI(user.id, user.email!);
          console.log("✅ FastAPI token obtained");
        } catch (error) {
          console.error(
            "⚠️ FastAPI sync failed, but continuing with NextAuth login"
          );
          // Continue without FastAPI token
        }

        // Return user object with FastAPI token
        return {
          id: user.id,
          email: user.email!,
          name: `${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          image: user.image,
          physicianId: user.physicianId,
          fastapi_token: fastapiToken,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.physicianId = user.physicianId;
        token.fastapi_token = user.fastapi_token;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.physicianId = token.physicianId as string;
        session.user.fastapi_token = token.fastapi_token as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
