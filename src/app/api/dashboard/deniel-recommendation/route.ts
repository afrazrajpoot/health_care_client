// Updated backend API route (/api/patients/route.ts or similar)
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

    // ✅ Build a flexible where clause with AND conditions
    const whereClause: Prisma.DocumentWhereInput = {};
    const andConditions: Prisma.DocumentWhereInput[] = [];

    if (mode) {
      andConditions.push({ mode });
    }

    if (physicianId) {
      andConditions.push({ physicianId });
    }

    // Add search conditions dynamically as AND (only if they exist and not "Not specified")
    if (patientName && patientName !== "Not specified") {
      andConditions.push({
        patientName: { contains: patientName, mode: "insensitive" },
      });
    }
    if (claimNumber && claimNumber !== "Not specified") {
      andConditions.push({
        claimNumber: { contains: claimNumber, mode: "insensitive" },
      });
    }
    if (dobParam && dobParam !== "Not specified") {
      andConditions.push({
        dob: { equals: dobParam },
      });
    }

    // Filter for documents with ur_denial_reason
    andConditions.push({
      ur_denial_reason: { not: null, not: "" }
    });

    // If no conditions, fallback to all docs (but we'll limit with take)
    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    } else {
      whereClause.id = { not: null }; // fallback: all docs
    }

    console.debug("🧠 Flexible whereClause:", JSON.stringify(whereClause));

    const results = await prisma.document.findMany({
      where: whereClause,
      include: {
        bodyPartSnapshots: {
          select: {
            bodyPart: true,
            dx: true,
          },
        },
      },
      take: 50, // Increased limit to account for multiples per patient
      orderBy: { createdAt: "desc" },
    });

    // ✅ Filter for completeness - relaxed to not require dob, but require ur_denial_reason
    const completeResults = results.filter((doc) => {
      return (
        !!doc.patientName &&
        doc.patientName.toLowerCase() !== "not specified" &&
        !!doc.ur_denial_reason &&
        doc.ur_denial_reason.trim() !== ""
        // Removed !!doc.dob to allow missing or "Not specified" DOB
      );
    });

    let uniqueResults: any[] = [];
    let patientNames: string[] = [];

    if (completeResults.length > 0) {
      // ✅ Group by patient key and aggregate bodyPartSnapshots
      // Normalize dob to empty string if null or "Not specified"
      const grouped = new Map<string, typeof completeResults[0][]>();
      completeResults.forEach((doc) => {
        const normalizedDob = doc.dob === "Not specified" || !doc.dob ? "" : doc.dob;
        const key = `${doc.patientName}-${doc.claimNumber || ""}-${normalizedDob}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(doc);
      });

      // For each group, create aggregated document with unique snapshots from all docs in group
      uniqueResults = Array.from(grouped.values()).map((group) => {
        // Sort by createdAt desc to get latest as base
        group.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const latestDoc = group[0];

        // Collect all snapshots and unique by bodyPart + dx
        const allSnapshots = group.flatMap((d) => d.bodyPartSnapshots || []);
        const uniqueSnapshotsMap = new Map(
          allSnapshots.map((s) => [`${s.bodyPart}-${s.dx}`, s])
        );
        const uniqueSnapshots = Array.from(uniqueSnapshotsMap.values());

        // Return aggregated doc using latest as base, with all unique snapshots
        return {
          ...latestDoc,
          bodyPartSnapshots: uniqueSnapshots,
        };
      });

      // ✅ Extract patientNames
      patientNames = Array.from(
        new Set(uniqueResults.map((r) => r.patientName).filter(Boolean))
      );
    }

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

    // Always return 200 with data, even if empty
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
    // Even on error, return 200 with empty data instead of 500 to avoid frontend errors
    return NextResponse.json({
      success: false,
      data: {
        patientNames: [],
        allMatchingDocuments: [],
        totalCount: 0,
      },
      error: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
}