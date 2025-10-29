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
    const patientName = searchParams.get("patientName")?.trim() || null;
    const claimNumber = searchParams.get("claimNumber")?.trim() || null;
    const dobParam = searchParams.get("dob")?.trim() || null;
    let physicianId = searchParams.get("physicianId");
    const mode = searchParams.get("mode");

    if (
      physicianId === "null" ||
      physicianId === "undefined" ||
      physicianId === ""
    ) {
      physicianId = null;
    }

    // ✅ Build a flexible where clause
    const whereClause: Prisma.DocumentWhereInput = {};
    const andConditions: Prisma.DocumentWhereInput[] = [];

    if (mode) {
      andConditions.push({ mode });
    }

    if (physicianId) {
      andConditions.push({ physicianId });
    }

    // Add conditions dynamically (only if they exist)
    const orConditions: Prisma.DocumentWhereInput[] = [];
    if (patientName) {
      orConditions.push({
        patientName: { contains: patientName, mode: "insensitive" },
      });
    }
    if (claimNumber) {
      orConditions.push({
        claimNumber: { contains: claimNumber, mode: "insensitive" },
      });
    }
    if (dobParam) {
      orConditions.push({
        dob: { equals: dobParam },
      });
    }

    // If any search fields exist, use OR; otherwise, fallback to all docs (limit results)
    if (orConditions.length > 0) {
      andConditions.push({ OR: orConditions });
    } else {
      whereClause.id = { not: null }; // fallback: all docs
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    console.debug("🧠 Flexible whereClause:", JSON.stringify(whereClause));

    const results = await prisma.document.findMany({
      where: whereClause,
      select: {
        patientName: true,
        claimNumber: true,
        dob: true,
        doi: true,
        id: true,
        physicianId: true,
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    if (!results.length) {
      return NextResponse.json(
        { message: "No matching patients found" },
        { status: 404 }
      );
    }

    // ✅ Filter for completeness
    const completeResults = results.filter((doc) => {
      return (
        !!doc.patientName &&
        doc.patientName.toLowerCase() !== "not specified" &&
        !!doc.dob
      );
    });

    if (completeResults.length === 0) {
      return NextResponse.json(
        {
          message:
            "No complete patient records found (missing fields in all matches)",
        },
        { status: 404 }
      );
    }

    // ✅ Deduplicate by patientName + claimNumber + dob
    const uniqueKeyMap = new Map<string, (typeof completeResults)[0]>();
    completeResults.forEach((doc) => {
      const key = `${doc.patientName}-${doc.claimNumber || ""}-${String(
        doc.dob
      )}`;
      if (!uniqueKeyMap.has(key)) {
        uniqueKeyMap.set(key, doc);
      }
    });
    const uniqueResults = Array.from(uniqueKeyMap.values());

    // ✅ Extract patientNames
    const patientNames = Array.from(
      new Set(uniqueResults.map((r) => r.patientName).filter(Boolean))
    );

    // ✅ Save Audit Log (non-blocking)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          email: session.user.email,
          action: `Flexible search: patientName="${patientName ?? ""}", claimNumber="${claimNumber ?? ""}", dob="${dobParam ?? ""}", physicianId="${physicianId ?? ""}", mode="${mode ?? ""}"`,
          path: "/api/patients",
          method: "GET",
        },
      });
    } catch (auditErr) {
      console.error("⚠️ Audit log failed:", auditErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        patientNames,
        allMatchingDocuments: uniqueResults,
        totalCount: uniqueResults.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching patient name suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}