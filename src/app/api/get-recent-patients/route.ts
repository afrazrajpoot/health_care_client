// app/api/documents/recent/route.ts
import { NextResponse } from "next/server";
import { prisma, ensurePrismaConnection } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/authSErvice";
import CryptoJS from "crypto-js";

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
    // Ensure Prisma is connected before use
    // await ensurePrismaConnection();

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const search = searchParams.get("search")?.trim();

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

    // 🔒 Enforce staff visibility rule: "show patient ... only that his physcian assign"
    if (session.user.role === "Staff") {
      // Filter documents that have tasks assigned to this staff member
      // We match against ID, firstName, or Full Name to be safe as assignee storage format varies
      whereClause.tasks = {
        some: {
          OR: [
            { assignee: session.user.id },
            { assignee: session.user.firstName },
            { assignee: `${session.user.firstName} ${session.user.lastName}` }
          ]
        }
      };
      console.log('🔒 Enforcing staff patient visibility for:', session.user.firstName);
    }

    if (mode) whereClause.mode = mode;

    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        {
          patientName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          claimNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Fetch documents with their documentSummary relation
    let documents;
    let retries = 3;
    while (retries > 0) {
      try {
        documents = await prisma.document.findMany({
          select: {
            id: true,
            patientName: true,
            dob: true,
            claimNumber: true,
            createdAt: true,
            reportDate: true,
            mode: true,
            documentSummary: {
              select: {
                type: true,
                date: true,
                summary: true,
              },
            },
          },
          where: whereClause,
          orderBy: { createdAt: "desc" },
        });
        break; // Success, exit loop
      } catch (error: any) {
        retries--;
        const isConnectionError =
          error?.message?.includes("Engine is not yet connected") ||
          error?.message?.includes("Client is not connected") ||
          error?.message?.includes("Can't reach database server");

        if (isConnectionError && retries > 0) {
          console.warn(`⚠️ Prisma connection error. Retrying... (${retries} attempts left)`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          // If it's not a connection error or we're out of retries, throw
          throw error;
        }
      }
    }

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
          if (doc.patientName) {
            const currentName = (group.patientName || "").trim();
            const newName = doc.patientName.trim();
            if (!currentName || newName.length > currentName.length) {
              group.patientName = doc.patientName;
            }
          }

          if (!group.dob && doc.dob) {
            group.dob = doc.dob;
          } else if (group.dob && doc.dob) {
            if (doc.createdAt > group.createdAt) {
              group.dob = doc.dob;
            }
          }

          const groupClaimNormalized = normalizeClaimNumber(group.claimNumber);
          const docClaimNormalized = normalizeClaimNumber(doc.claimNumber);

          if (!groupClaimNormalized && docClaimNormalized) {
            group.claimNumber = doc.claimNumber;
          }
          else if (groupClaimNormalized && docClaimNormalized && doc.createdAt > group.createdAt) {
            group.claimNumber = doc.claimNumber;
          }
          else if (!group.claimNumber && doc.claimNumber) {
            group.claimNumber = doc.claimNumber;
          }

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
        documentType: mostRecentDoc.documentSummary?.type || null,
        ...(group.documents.length > 1 && {
          matchingDocuments: group.documents.map((d) => ({
            id: d.id,
            patientName: d.patientName,
            dob: d.dob,
            claimNumber: d.claimNumber,
            createdAt: d.createdAt,
            reportDate: d.reportDate,
            mode: d.mode,
            documentType: d.documentSummary?.type || null,
          })),
        }),
      };
    });

    /* ---------------------------------------------
     * ENCRYPT THE RESPONSE
     * --------------------------------------------- */

    // Get encryption secret from environment variables
    const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

    if (!ENCRYPTION_SECRET) {
      console.error('❌ Encryption secret not configured');
      return NextResponse.json(
        {
          encrypted: false,
          error: 'Server configuration error',
          data: recent,
          warning: 'Response not encrypted due to server configuration'
        },
        { status: 200 }
      );
    }

    try {
      // Encrypt the response data
      const dataString = JSON.stringify(recent);
      const encryptedData = CryptoJS.AES.encrypt(dataString, ENCRYPTION_SECRET).toString();

      console.log('🔐 Recent documents response encrypted successfully', {
        patientsCount: recent.length,
        encryptedDataLength: encryptedData.length
      });

      // Return encrypted response
      return NextResponse.json({
        encrypted: true,
        data: encryptedData,
        timestamp: new Date().toISOString(),
        route_marker: 'recent-documents-api-encrypted',
        metadata: {
          patientCount: recent.length,
          encryption: 'AES'
        }
      });

    } catch (encryptionError) {
      console.error('❌ Failed to encrypt recent documents response:', encryptionError);

      // Fallback: Return unencrypted response with warning
      return NextResponse.json({
        encrypted: false,
        warning: 'Encryption failed, returning unencrypted data',
        data: recent,
        timestamp: new Date().toISOString(),
        error: encryptionError instanceof Error ? encryptionError.message : 'Unknown encryption error'
      });
    }

  } catch (error) {
    console.error("Error fetching recent documents:", error);

    // Even for errors, we can encrypt the error response
    const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

    if (ENCRYPTION_SECRET) {
      try {
        const errorData = {
          error: "Failed to fetch recent documents",
          details: error instanceof Error ? error.message : 'Unknown error'
        };
        const dataString = JSON.stringify(errorData);
        const encryptedData = CryptoJS.AES.encrypt(dataString, ENCRYPTION_SECRET).toString();

        return NextResponse.json({
          encrypted: true,
          data: encryptedData,
          timestamp: new Date().toISOString(),
          isError: true
        }, { status: 500 });
      } catch {
        // If encryption fails, return plain error
        return NextResponse.json(
          { error: "Failed to fetch recent documents" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Failed to fetch recent documents" },
        { status: 500 }
      );
    }
  }
  // Note: Do NOT call prisma.$disconnect() here as it causes issues with concurrent requests
}