import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authSErvice";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName");
    const claimNumber = searchParams.get("claimNumber");
    let physicianId = searchParams.get("physicianId");

    // ✅ Normalize physicianId
    if (physicianId === "null" || physicianId === "undefined" || physicianId === "") {
      physicianId = null;
    }

    if (!patientName && !claimNumber) {
      return NextResponse.json(
        { error: "Either patientName or claimNumber is required" },
        { status: 400 }
      );
    }

    // ✅ Build OR conditions
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

    // ✅ Apply physicianId only if valid
    const whereClause: Prisma.DocumentWhereInput = {
      OR: orConditions,
      ...(physicianId ? { physicianId } : {}),
    };

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

    const patientNames = Array.from(
      new Set(results.map(r => r.patientName).filter(Boolean))
    );
    const claimNumbers = Array.from(
      new Set(results.map(r => r.claimNumber).filter(Boolean))
    );

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        action: `Searched suggestions: patientName="${
          patientName ?? ""
        }", claimNumber="${claimNumber ?? ""}"${
          physicianId ? `, physicianId="${physicianId}"` : ""
        }`,
        path: "/api/patients",
        method: "GET",
      },
    });

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
