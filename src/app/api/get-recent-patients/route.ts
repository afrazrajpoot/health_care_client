// app/api/documents/recent/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/authSErvice";

const prisma = new PrismaClient();

/* ---------------------------------------------
 * NORMALIZATION HELPERS
 * --------------------------------------------- */

// Normalize name → remove commas/middle names, reorder alphabetically
function normalizePatientName(name: string | null | undefined): string {
  if (!name) return "";

  const cleaned = name.replace(/,/g, " ").toLowerCase().trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "";

  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    return [first, last].sort().join(" ");
  }

  return parts[0]; // Single name case
}

// Normalize claim → uppercase alphanumeric only
function normalizeClaimNumber(claim: string | null | undefined): string {
  if (!claim) return "";
  return claim.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

// Normalize DOB → YYYY-MM-DD
function normalizeDOB(dob: Date | string | null | undefined): string {
  if (!dob) return "";

  try {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  } catch {
    return "";
  }
}

/* ---------------------------------------------
 * SAME-PATIENT LOGIC
 * --------------------------------------------- */

function isSamePatient(
  name1: string,
  dob1: string,
  claim1: string,
  name2: string,
  dob2: string,
  claim2: string
): boolean {
  // Rule 1: Different claims → NOT same
  if (claim1 && claim2 && claim1 !== claim2) return false;

  // Rule 2: Same claim → ALWAYS same patient
  if (claim1 && claim2 && claim1 === claim2) return true;

  // Rule 3: Names must match (after normalization)
  if (name1 !== name2) return false;

  // 3A: Both have DOB and match
  if (dob1 && dob2 && dob1 === dob2) return true;

  // 3B: Both missing DOB
  if (!dob1 && !dob2) return true;

  // 3C: One has DOB, the other doesn't → still same
  if ((dob1 && !dob2) || (dob2 && !dob1)) return true;

  return false;
}

/* ---------------------------------------------
 * GET RECENT UNIQUE PATIENT DOCUMENTS
 * --------------------------------------------- */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let physicianId;
    if (session.user.role === "Physician") physicianId = session.user.id;
    else if (session.user.role === "Staff")
      physicianId = session.user.physicianId;

    const whereClause: any = {
      physicianId,
      patientName: {
        notIn: ["", "Not specified", "Not Specified", "Undefined", "N/A", "NA"],
      },
    };

    if (mode) whereClause.mode = mode;

    const documents = await prisma.document.findMany({
      select: {
        id: true,
        patientName: true,
        dob: true,
        claimNumber: true,
        createdAt: true,
      },
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    /* ---------------------------------------------
     * Cleanup invalid names
     * --------------------------------------------- */
    const cleanedDocuments = documents.filter((doc) => {
      const name = (doc.patientName || "").trim().toLowerCase();
      return (
        name && !["not specified", "undefined", "n/a", "na"].includes(name)
      );
    });

    /* ---------------------------------------------
     * Deduplication using SAME-PATIENT rules
     * --------------------------------------------- */

    const uniqueDocs: typeof cleanedDocuments = [];

    for (const doc of cleanedDocuments) {
      const docName = normalizePatientName(doc.patientName);
      const docClaim = normalizeClaimNumber(doc.claimNumber);
      const docDOB = normalizeDOB(doc.dob);

      let alreadyExists = false;

      for (const u of uniqueDocs) {
        const uName = normalizePatientName(u.patientName);
        const uClaim = normalizeClaimNumber(u.claimNumber);
        const uDOB = normalizeDOB(u.dob);

        if (isSamePatient(docName, docDOB, docClaim, uName, uDOB, uClaim)) {
          alreadyExists = true;
          break;
        }
      }

      if (!alreadyExists) {
        uniqueDocs.push(doc);
      }
    }

    /* ---------------------------------------------
     * Return latest 10 deduped patients
     * --------------------------------------------- */

    const recent = uniqueDocs.slice(0, 10).map((doc) => ({
      patientName: doc.patientName,
      dob: doc.dob,
      claimNumber: doc.claimNumber,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json(recent);
  } catch (error) {
    console.error("Error fetching recent documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent documents" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
