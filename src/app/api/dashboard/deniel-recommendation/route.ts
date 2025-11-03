// Updated backend API route (e.g., /api/dashboard/deniel-recommendation/route.ts)
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
    const strict = searchParams.get("strict") !== "false"; // Optional param to bypass post-filter for debugging

    if (
      physicianId === "null" ||
      physicianId === "undefined" ||
      physicianId === ""
    ) {
      physicianId = null;
    }

    // Log query params for debugging
    console.log("Query params:", { patientName, claimNumber, dobParam, physicianId, mode, strict });

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
      // ✅ Use contains for partial, case-insensitive matching (replaces invalid regex)
      // For multi-word (e.g., "Dummy Dummy"), this matches the full input as a substring
      // If you need OR for each word, uncomment the alternative below
      andConditions.push({
        patientName: { 
          contains: patientName, 
          mode: 'insensitive'  // Case-insensitive (works on supported DBs like PostgreSQL)
        },
      });

      // Alternative: Multi-word OR matching (e.g., contains "Dummy" OR contains "Dummy")
      // const words = patientName.split(/\s+/).map(w => w.trim()).filter(Boolean);
      // if (words.length > 0) {
      //   const orConditions: Prisma.DocumentWhereInput[] = words.map(word => ({
      //     patientName: { contains: word, mode: 'insensitive' }
      //   }));
      //   andConditions.push({ OR: orConditions });
      // }
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

    // ✅ Always filter for documents with ur_denial_reason (non-null and non-empty)
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

    // Log raw results count for debugging
    console.log("Raw results count:", results.length);

    // ✅ Filter for completeness - relaxed to not require dob, ur_denial_reason is already enforced in query
    let completeResults = results;
    if (strict) {
      completeResults = results.filter((doc) => {
        const hasValidPatientName = !!doc.patientName && doc.patientName.toLowerCase() !== "not specified";
        return hasValidPatientName;
        // ur_denial_reason is always required via query; DOB optional
      });
    }

    // Log complete results count for debugging
    console.log("Complete results count:", completeResults.length);

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

      // Log grouped keys for debugging
      console.log("Grouped keys:", Array.from(grouped.keys()));

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

    // Log unique results count for debugging
    console.log("Unique results count:", uniqueResults.length);

    // ✅ Save Audit Log (non-blocking)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          email: session.user.email,
          action: `Flexible search: patientName="${patientName ?? ""}", claimNumber="${claimNumber ?? ""}", dob="${dobParam ?? ""}", physicianId="${physicianId ?? ""}", mode="${mode ?? ""}", strict="${strict}"`,
          path: "/api/dashboard/deniel-recommendation",
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
    // Log full error for better debugging
    console.error("❌ Full error fetching patient name suggestions:", error);
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