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
    const dobParam = searchParams.get("dob");
    let physicianId = searchParams.get("physicianId");

    // ✅ Normalize physicianId
    if (
      physicianId === "null" ||
      physicianId === "undefined" ||
      physicianId === ""
    ) {
      physicianId = null;
    }

    // Require at least one search input (patientName, claimNumber, dob) or physicianId
    if (!patientName && !claimNumber && !dobParam && !physicianId) {
      return NextResponse.json(
        {
          error:
            "At least one of patientName, claimNumber, dob, or physicianId is required for search",
        },
        { status: 400 }
      );
    }

    // ✅ Build where clause: when a search term is provided, match it against
    // patientName and claimNumber (OR). DOB matching is done in JS after
    // fetching because the DB type for dob may not allow string 'contains'
    // filters in Prisma without regenerating the client.
    const whereClause: Prisma.DocumentWhereInput = {};
    const searchTerm = (patientName || claimNumber || dobParam)?.trim() ?? null;

    if (searchTerm) {
      const term = searchTerm;
      const orConditions: Prisma.DocumentWhereInput[] = [
        { patientName: { contains: term, mode: "insensitive" } },
        { claimNumber: { contains: term, mode: "insensitive" } },
      ];

      if (physicianId) {
        // Both physicianId must match and at least one of the OR conditions
        whereClause.AND = [{ physicianId: physicianId }, { OR: orConditions }];
      } else {
        whereClause.OR = orConditions;
      }
    } else if (physicianId) {
      whereClause.physicianId = physicianId;
    }

    // Get all matching documents (no distinct to return all)
    let results;
    try {
      // Log the computed whereClause for debugging when users search by claimNumber/dob
      console.debug(
        "Recommendation route whereClause:",
        JSON.stringify(whereClause)
      );
      results = await prisma.document.findMany({
        where: whereClause,
        select: {
          patientName: true,
          claimNumber: true,
          dob: true,
          doi: true,
          id: true, // Include ID to differentiate duplicates
        },
        // distinct: ["patientName"],  // Removed to get all
        take: 20, // Optional limit to avoid overload
        orderBy: { createdAt: "desc" }, // Sort by newest
      });
    } catch (dbError: unknown) {
      console.error("Prisma findMany error in recommendation route:", dbError);
      const message =
        dbError && (dbError as any).message
          ? (dbError as any).message
          : String(dbError);
      return NextResponse.json(
        { error: `Database query failed: ${message}` },
        { status: 500 }
      );
    }

    if (results.length === 0) {
      return NextResponse.json(
        { message: "No matching patients found" },
        { status: 404 }
      );
    }

    // ✅ Filter out incomplete documents: only include if all key fields are present and not "Not specified"
    const completeResults = results.filter((doc: (typeof results)[number]) => {
      return (
        !!doc.patientName &&
        doc.patientName.toLowerCase() !== "not specified" &&
        !!doc.claimNumber &&
        (typeof doc.claimNumber !== "string" ||
          doc.claimNumber.toLowerCase() !== "not specified") &&
        !!doc.dob &&
        !!doc.doi
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

    // Deduplicate by composite key: patientName + claimNumber + dob + doi
    // Preserve the first occurrence (newest due to orderBy)
    const uniqueKeyMap = new Map<string, (typeof completeResults)[0]>();
    completeResults.forEach((doc: (typeof completeResults)[number]) => {
      const key = `${doc.patientName}-${doc.claimNumber || ""}-${String(
        doc.dob
      )}-${String(doc.doi)}`;
      if (!uniqueKeyMap.has(key)) {
        uniqueKeyMap.set(key, doc);
      }
    });
    const uniqueResults = Array.from(uniqueKeyMap.values());

    // If a search term was provided, further filter the uniqueResults in JS
    // to allow DOB matching (we compare stringified dob). This avoids
    // depending on Prisma client types for dob.
    let filteredResults = uniqueResults;
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      filteredResults = uniqueResults.filter((r) => {
        const nameMatch = r.patientName?.toLowerCase().includes(termLower);
        const claimMatch = r.claimNumber
          ? String(r.claimNumber).toLowerCase().includes(termLower)
          : false;
        const dobMatch = r.dob
          ? String(r.dob).toLowerCase().includes(termLower)
          : false;
        return !!nameMatch || !!claimMatch || !!dobMatch;
      });
    }

    // Extract unique patientNames, but include all docs in response if needed
    const patientNames = Array.from(
      new Set(filteredResults.map((r) => r.patientName).filter(Boolean))
    );

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          email: session.user.email,
          action: `Searched patient names: patientName="${patientName ?? ""}"${
            physicianId ? `, physicianId="${physicianId}"` : ""
          }`,
          path: "/api/patients",
          method: "GET",
        },
      });
    } catch (auditErr) {
      // Audit failures should not block the response; log and continue
      console.error(
        "Failed to write audit log in recommendation route:",
        auditErr
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        patientNames,
        allMatchingDocuments: uniqueResults, // Deduplicated list of complete matching docs
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
