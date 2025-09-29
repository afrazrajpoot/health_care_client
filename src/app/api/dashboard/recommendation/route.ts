import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authSErvice";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // ✅ Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // ✅ Extract search params
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName");
    const claimNumber = searchParams.get("claimNumber");

    if (!patientName && !claimNumber) {
      return NextResponse.json(
        { error: "Either patientName or claimNumber is required" },
        { status: 400 }
      );
    }

    // ✅ Build OR filter (case-insensitive contains)
    const orConditions: Prisma.DocumentWhereInput[] = [];

    if (patientName) {
      orConditions.push({
        patientName: {
          contains: patientName,
          mode: "insensitive",
        },
      });
    }

    if (claimNumber) {
      orConditions.push({
        claimNumber: {
          contains: claimNumber,
          mode: "insensitive",
        },
      });
    }

    const whereClause: Prisma.DocumentWhereInput = {
      OR: orConditions,
    };

    // ✅ Fetch distinct suggestions
    const results = await prisma.document.findMany({
      where: whereClause,
      select: {
        patientName: true,
        claimNumber: true,
      },
      distinct: ["patientName", "claimNumber"],
    });

    if (results.length === 0) {
      return NextResponse.json(
        { message: "No matching patients or claims found" },
        { status: 404 }
      );
    }

    // ✅ Prepare suggestions
    const patientNames = Array.from(
      new Set(
        results
          .map((r: { patientName: string | null }) => r.patientName)
          .filter(Boolean)
      )
    );
    const claimNumbers = Array.from(
      new Set(
        results
          .map((r: { claimNumber: string | null }) => r.claimNumber)
          .filter(Boolean)
      )
    );

    // ✅ Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        action: `Searched suggestions: patientName="${
          patientName ?? ""
        }", claimNumber="${claimNumber ?? ""}"`,
        path: "/api/patients",
        method: "GET",
      },
    });

    // ✅ Return suggestions
    return NextResponse.json({
      success: true,
      data: {
        patientNames,
        claimNumbers,
      },
    });
  } catch (error) {
    console.error("Error fetching patient/claim suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
