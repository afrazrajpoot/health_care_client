// app/api/documents/recent/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/authSErvice";

const prisma = new PrismaClient();

/* ---------------------------------------------
 * NORMALIZATION HELPERS
 * --------------------------------------------- */

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

// Fuzzy name match (allows 1-2 character difference)
function fuzzyNameMatch(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  if (name1 === name2) return true;

  const distance = levenshteinDistance(name1, name2);
  const maxLen = Math.max(name1.length, name2.length);

  // Allow up to 2 character difference or 15% difference
  return distance <= 2 || distance / maxLen <= 0.15;
}

// Normalize name → remove commas/middle names, reorder alphabetically
function normalizePatientName(name: string | null | undefined): string {
  if (!name) return "";

  // Remove commas and convert to lowercase
  const cleaned = name.replace(/,/g, " ").toLowerCase().trim();

  // Split by whitespace and filter out empty strings and single-letter parts (middle initials)
  const parts = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => part.length > 1); // Remove single-letter middle initials

  if (parts.length === 0) return "";

  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    return [first, last].sort().join(" ");
  }

  return parts[0]; // Single name case
}

// Extract first and last name separately
function getNameParts(name: string | null | undefined): {
  first: string;
  last: string;
} {
  if (!name) return { first: "", last: "" };

  const cleaned = name.replace(/,/g, " ").toLowerCase().trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };

  return { first: parts[0], last: parts[parts.length - 1] };
}

// Normalize claim → uppercase alphanumeric only
// Treat invalid claims as empty
function normalizeClaimNumber(claim: string | null | undefined): string {
  if (!claim) return "";

  const normalized = claim.trim().toLowerCase();

  // Check for invalid/placeholder values
  const invalidClaims = [
    "not specified",
    "notspecified",
    "unspecified",
    "n/a",
    "na",
    "none",
    "unknown",
    "undefined",
    "",
  ];

  if (invalidClaims.includes(normalized)) {
    return "";
  }

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

// Check if two DOBs are within 1-2 days (for timezone/format issues)
function dobsWithinTolerance(
  dob1: string,
  dob2: string,
  toleranceDays: number = 2
): boolean {
  if (!dob1 || !dob2) return false;

  try {
    const d1 = new Date(dob1);
    const d2 = new Date(dob2);
    const diffMs = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= toleranceDays;
  } catch {
    return false;
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
  // 🎯 PRIMARY RULE: Match by claim number (if both have valid claims)
  // If both have claim numbers, they must match to be the same patient
  if (claim1 && claim2) {
    // Same claim number → ALWAYS same patient (merge them)
    if (claim1 === claim2) return true;
    // Different claim numbers → NOT same patient
    return false;
  }

  // 🎯 FALLBACK: If one or both don't have claim numbers, use name + DOB matching
  // This handles cases where claim number is missing
  if (!claim1 || !claim2) {
    // Extract name parts for advanced matching
    const parts1 = getNameParts(name1);
    const parts2 = getNameParts(name2);

    // Last name + DOB match (ignore first name)
    if (
      parts1.last &&
      parts2.last &&
      parts1.last === parts2.last &&
      dob1 &&
      dob2 &&
      (dob1 === dob2 || dobsWithinTolerance(dob1, dob2))
    ) {
      return true;
    }

    // Check if names match (exact or fuzzy)
    const namesMatch = name1 === name2 || fuzzyNameMatch(name1, name2);

    if (!namesMatch) return false;

    // Both have DOB and match (or within tolerance)
    if (dob1 && dob2) {
      return dob1 === dob2 || dobsWithinTolerance(dob1, dob2);
    }

    // Both missing DOB
    if (!dob1 && !dob2) return true;

    // One has DOB, the other doesn't → still same
    if ((dob1 && !dob2) || (dob2 && !dob1)) return true;
  }

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

    // Fetch documents with their documentSummary relation
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        patientName: true,
        dob: true,
        claimNumber: true,
        createdAt: true,
        reportDate: true,
        mode: true, // Also include mode if needed
        documentSummary: { // ✅ Include the related DocumentSummary
          select: {
            type: true, // This is the document type you want
            date: true,
            summary: true,
          },
        },
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
     * Group all matching documents together
     * --------------------------------------------- */

    interface PatientGroup {
      documents: typeof cleanedDocuments;
      patientName: string | null;
      dob: Date | string | null;
      claimNumber: string | null;
      createdAt: Date;
    }

    const patientGroups: PatientGroup[] = [];

    for (const doc of cleanedDocuments) {
      const docName = normalizePatientName(doc.patientName);
      const docClaim = normalizeClaimNumber(doc.claimNumber);
      const docDOB = normalizeDOB(doc.dob);

      let foundGroup = false;

      // Try to find an existing group this document belongs to
      for (const group of patientGroups) {
        // Check against the first document in the group
        const firstDoc = group.documents[0];
        const groupName = normalizePatientName(firstDoc.patientName);
        const groupClaim = normalizeClaimNumber(firstDoc.claimNumber);
        const groupDOB = normalizeDOB(firstDoc.dob);

        if (
          isSamePatient(
            docName,
            docDOB,
            docClaim,
            groupName,
            groupDOB,
            groupClaim
          )
        ) {
          group.documents.push(doc);

          // Update group fields with best available data
          // When merging by claim number, prefer the most complete information

          // Update patientName: prefer longer/more complete name
          if (doc.patientName) {
            const currentName = (group.patientName || "").trim();
            const newName = doc.patientName.trim();
            // Use the longer name (more likely to be complete) or the new one if current is empty
            if (!currentName || newName.length > currentName.length) {
              group.patientName = doc.patientName;
            }
          }

          // Update DOB: prefer non-null DOB
          if (!group.dob && doc.dob) {
            group.dob = doc.dob;
          } else if (group.dob && doc.dob) {
            // If both have DOB, keep the one from the most recent document
            if (doc.createdAt > group.createdAt) {
              group.dob = doc.dob;
            }
          }

          // Update claimNumber: always keep the valid claim (since that's what matched)
          const groupClaimNormalized = normalizeClaimNumber(group.claimNumber);
          const docClaimNormalized = normalizeClaimNumber(doc.claimNumber);

          // If group has no valid claim but doc does, use doc's claim
          if (!groupClaimNormalized && docClaimNormalized) {
            group.claimNumber = doc.claimNumber;
          }
          // If both have valid claims (they should match), keep the one from most recent doc
          else if (groupClaimNormalized && docClaimNormalized && doc.createdAt > group.createdAt) {
            group.claimNumber = doc.claimNumber;
          }
          // Or if group has invalid placeholder but doc has valid claim
          else if (!group.claimNumber && doc.claimNumber) {
            group.claimNumber = doc.claimNumber;
          }

          // Keep the most recent createdAt
          if (doc.createdAt > group.createdAt) {
            group.createdAt = doc.createdAt;
          }

          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        // Create a new group for this patient
        patientGroups.push({
          documents: [doc],
          patientName: doc.patientName,
          dob: doc.dob,
          claimNumber: doc.claimNumber,
          createdAt: doc.createdAt,
        });
      }
    }

    /* ---------------------------------------------
     * Return latest 10 patient groups with all matching documents
     * --------------------------------------------- */

    // Sort by most recent activity
    patientGroups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const recent = patientGroups.slice(0, 10).map((group) => {
      // Get the most recent document from the group
      const mostRecentDoc = group.documents.reduce((latest, current) =>
        current.createdAt > latest.createdAt ? current : latest
      );

      return {
        patientName: group.patientName,
        dob: group.dob,
        claimNumber: group.claimNumber,
        createdAt: group.createdAt,
        reportDate: mostRecentDoc.reportDate,
        documentCount: group.documents.length,
        documentIds: group.documents.map((d) => d.id),
        // Include document type from the most recent document's summary
        documentType: mostRecentDoc.documentSummary?.type || null,
        // Include all document details if multiple matches
        ...(group.documents.length > 1 && {
          matchingDocuments: group.documents.map((d) => ({
            id: d.id,
            patientName: d.patientName,
            dob: d.dob,
            claimNumber: d.claimNumber,
            createdAt: d.createdAt,
            reportDate: d.reportDate,
            mode: d.mode,
            documentType: d.documentSummary?.type || null, // Include type for each matching document
          })),
        }),
      };
    });

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