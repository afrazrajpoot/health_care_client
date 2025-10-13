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
    const claimNumber = searchParams.get("claimNumber"); // Still capture, but ignore for matching
    let physicianId = searchParams.get("physicianId");

    // ✅ Normalize physicianId
    if (physicianId === "null" || physicianId === "undefined" || physicianId === "") {
      physicianId = null;
    }

    if (!patientName && !physicianId) {
      return NextResponse.json(
        { error: "At least one of patientName or physicianId is required for search" },
        { status: 400 }
      );
    }

    // ✅ Build where clause with AND for patientName and physicianId (match both if provided)
    const whereClause: Prisma.DocumentWhereInput = {};

    if (patientName) {
      whereClause.patientName = {
        contains: patientName,
        mode: "insensitive",
      };
    }

    if (physicianId) {
      whereClause.physicianId = physicianId;
    }

    // Get all matching documents (no distinct to return all)
    const results = await prisma.document.findMany({
      where: whereClause,
      select: {
        patientName: true,
        claimNumber: true,
        dob: true,
        doi: true,
        id: true,  // Include ID to differentiate duplicates
      },
      // distinct: ["patientName"],  // Removed to get all
      take: 20,  // Optional limit to avoid overload
      orderBy: { createdAt: "desc" },  // Sort by newest
    });

    if (results.length === 0) {
      return NextResponse.json(
        { message: "No matching patients found" },
        { status: 404 }
      );
    }

    // ✅ Filter out incomplete documents: only include if all key fields are present and not "Not specified"
    const completeResults = results.filter(doc => {
      return (
        doc.patientName &&
        doc.patientName.toLowerCase() !== "not specified" &&
        doc.claimNumber &&
        doc.claimNumber.toLowerCase() !== "not specified" &&
        doc.dob &&
        doc.dob.toLowerCase() !== "not specified" &&
        doc.doi &&
        doc.doi.toLowerCase() !== "not specified"
      );
    });

    if (completeResults.length === 0) {
      return NextResponse.json(
        { message: "No complete patient records found (missing fields in all matches)" },
        { status: 404 }
      );
    }

    // Deduplicate by composite key: patientName + claimNumber + dob + doi
    // Preserve the first occurrence (newest due to orderBy)
    const uniqueKeyMap = new Map<string, typeof completeResults[0]>();
    completeResults.forEach(doc => {
      const key = `${doc.patientName}-${doc.claimNumber || ''}-${doc.dob}-${doc.doi}`;
      if (!uniqueKeyMap.has(key)) {
        uniqueKeyMap.set(key, doc);
      }
    });
    const uniqueResults = Array.from(uniqueKeyMap.values());

    // Extract unique patientNames, but include all docs in response if needed
    const patientNames = Array.from(
      new Set(uniqueResults.map(r => r.patientName).filter(Boolean))
    );

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        action: `Searched patient names: patientName="${patientName ?? ''}"${
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
        allMatchingDocuments: uniqueResults,  // Deduplicated list of complete matching docs
        totalCount: uniqueResults.length,
      },
    });
  } catch (error) {
    console.error("Error fetching patient name suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}