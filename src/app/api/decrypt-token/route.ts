import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-fallback-secret-for-development-only";

interface DecodedToken {
  patient: string;
  dob: string;
  claimNumber?: string;
  visit: string;
  lang: string;
  mode: string;
  body: string;
  exp: number;
  auth: string;
  createdAt: string;
  iat?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Verify and decrypt the token
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return NextResponse.json(
        {
          error: "Token has expired",
          expired: true,
        },
        { status: 401 }
      );
    }

    // Return the decrypted patient data
    return NextResponse.json({
      valid: true,
      patientData: {
        patientName: decoded.patient,
        dateOfBirth: decoded.dob,
        visitType: decoded.visit,
        language: decoded.lang,
        mode: decoded.mode,
        bodyParts: decoded.body,
        claimNumber: decoded.claimNumber || null,
        expiresIn: decoded.exp,
        requireAuth: decoded.auth,
        createdAt: decoded.createdAt,
      },
    });
  } catch (error) {
    console.error("Token decryption error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid token",
        },
        { status: 401 }
      );
    }

    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        {
          valid: false,
          error: "Token has expired",
          expired: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        valid: false,
        error: "Failed to decrypt token",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token parameter is required" },
        { status: 400 }
      );
    }

    // Verify and decrypt the token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return NextResponse.json(
        {
          error: "Token has expired",
          expired: true,
        },
        { status: 401 }
      );
    }

    // Return the decrypted patient data
    return NextResponse.json({
      valid: true,
      patientData: {
        patientName: decoded.patient,
        dateOfBirth: decoded.dob,
        visitType: decoded.visit,
        language: decoded.lang,
        mode: decoded.mode,
        bodyParts: decoded.body,
        claimNumber: decoded.claimNumber || null,
        requireAuth: decoded.auth,
        createdAt: decoded.createdAt,
      },
    });
  } catch (error) {
    console.error("Token decryption error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid token",
        },
        { status: 401 }
      );
    }

    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        {
          valid: false,
          error: "Token has expired",
          expired: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        valid: false,
        error: "Failed to decrypt token",
      },
      { status: 500 }
    );
  }
}
