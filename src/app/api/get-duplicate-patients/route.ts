// app/api/get-duplicate-patients/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/authSErvice";

const prisma = new PrismaClient();

/* ---------------------------------------------
 * HELPER FUNCTIONS
 * --------------------------------------------- */

/**
 * Normalize name: lowercase, remove punctuation, split into parts
 * Returns array of name parts (excluding middle initials)
 */
function getNameParts(name: string | null | undefined): string[] {
  if (!name) return [];

  // Remove commas, periods, and convert to lowercase
  const cleaned = name.replace(/[,\.]/g, " ").toLowerCase().trim();

  // Split by whitespace and filter out empty strings
  let parts = cleaned.split(/\s+/).filter(Boolean);

  // Remove single-letter parts (middle initials)
  parts = parts.filter((part) => part.length > 1);

  return parts;
}

/**
 * Check if two names match by comparing name parts
 * Names match if they share at least 2 common parts (first + last name)
 */
function namesMatch(name1: string | null, name2: string | null): boolean {
  if (!name1 || !name2) return false;

  const parts1 = getNameParts(name1);
  const parts2 = getNameParts(name2);

  if (parts1.length === 0 || parts2.length === 0) return false;

  // Count common parts
  const commonParts = parts1.filter((part) => parts2.includes(part));

  // Require at least 2 common parts (first + last name)
  return commonParts.length >= 2;
}

/**
 * Normalize claim number: remove all non-alphanumeric characters and convert to uppercase
 */
function normalizeClaimNumber(claim: string | null | undefined): string {
  if (!claim) return "";

  const trimmed = claim.trim().toLowerCase();

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

  if (invalidClaims.includes(trimmed)) {
    return "";
  }

  // Remove all non-alphanumeric characters (spaces, dashes, etc.) and uppercase
  return claim.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Extract the core sequence from a claim number
 * This is the main alphanumeric sequence, ignoring trailing suffixes like 01, 02
 */
function extractClaimCore(claim: string | null | undefined): string {
  if (!claim) return "";

  const normalized = normalizeClaimNumber(claim);
  if (!normalized) return "";

  // Remove trailing 01, 02, 03, 04, etc. patterns
  // These regex patterns handle: 01, 02, 10, 20, etc.
  let core = normalized;
  core = core.replace(/0[1-9]$/, ""); // Remove 01-09
  core = core.replace(/[1-9]0$/, ""); // Remove 10, 20, 30, etc.
  core = core.replace(/0[0-9]$/, ""); // Remove any trailing two digits starting with 0

  return core || normalized;
}

/**
 * Check if two claim numbers share a common sequence
 * They must have the SAME core sequence in the SAME order
 * Different claims but related: "JH3345", "JH 3 345", "AB-JH3345-01"
 */
function haveCommonClaimSequence(
  claim1: string | null,
  claim2: string | null
): boolean {
  if (!claim1 || !claim2) return false;

  const normalized1 = normalizeClaimNumber(claim1);
  const normalized2 = normalizeClaimNumber(claim2);

  if (!normalized1 || !normalized2) return false;

  // They should NOT be exactly the same (we want different but related claims)
  if (normalized1 === normalized2) return false;

  // Extract core sequences
  const core1 = extractClaimCore(claim1);
  const core2 = extractClaimCore(claim2);

  if (!core1 || !core2) return false;

  // Check if cores match (same sequence)
  if (core1 === core2) return true;

  // Check if shorter sequence is contained in longer (must be at least 4 chars)
  const shorter =
    normalized1.length < normalized2.length ? normalized1 : normalized2;
  const longer =
    normalized1.length < normalized2.length ? normalized2 : normalized1;

  // The shorter sequence must appear in the longer one AND be at least 4 characters
  // This handles: "JH3345" appearing in "ABJH334501"
  if (shorter.length >= 4 && longer.includes(shorter)) {
    return true;
  }

  // Check if one core is contained in the other
  if (core1.length >= 4 && core2.includes(core1)) return true;
  if (core2.length >= 4 && core1.includes(core2)) return true;

  return false;
}

/* ---------------------------------------------
 * GET DUPLICATE PATIENTS FOR A SPECIFIC PATIENT
 * --------------------------------------------- */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const patientNameParam = searchParams.get("patientName");

    // Patient name is required
    if (!patientNameParam) {
      return NextResponse.json(
        { error: "patientName parameter is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let physicianId;
    if (session.user.role === "Physician") physicianId = session.user.id;
    else if (session.user.role === "Staff")
      physicianId = session.user.physicianId;

    const invalidValues = [
      "",
      "Not specified",
      "Not Specified",
      "Undefined",
      "N/A",
      "NA",
    ];

    console.log(
      `\n🔍 Searching for duplicates of patient: "${patientNameParam}"`
    );

    // Get name parts of the target patient
    const targetNameParts = getNameParts(patientNameParam);

    if (targetNameParts.length < 2) {
      return NextResponse.json(
        { error: "Patient name must have at least first and last name" },
        { status: 400 }
      );
    }

    console.log(`Target name parts:`, targetNameParts);

    // Fetch all documents for this physician with valid data
    const whereClause: any = {
      physicianId,
      patientName: {
        notIn: invalidValues,
        not: "",
      },
      claimNumber: {
        notIn: invalidValues,
        not: "",
      },
    };

    if (mode) whereClause.mode = mode;

    const allDocuments = await prisma.document.findMany({
      select: {
        id: true,
        patientName: true,
        dob: true,
        doi: true,
        claimNumber: true,
        createdAt: true,
        fileName: true,
        gcsFileLink: true,
        blobPath: true,
      },
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    console.log(`Total documents in database: ${allDocuments.length}`);

    // Step 1: Filter documents that match the target patient's name
    const matchingNameDocuments = allDocuments.filter((doc) =>
      namesMatch(patientNameParam, doc.patientName)
    );

    console.log(
      `Documents with matching names: ${matchingNameDocuments.length}`
    );

    if (matchingNameDocuments.length < 2) {
      console.log("No duplicates found - patient has less than 2 records");
      return NextResponse.json([]);
    }

    // Step 2: Find documents with different but common claim numbers
    const duplicates: typeof allDocuments = [];
    const claimGroups = new Map<string, typeof allDocuments>();

    for (const doc of matchingNameDocuments) {
      const normalizedClaim = normalizeClaimNumber(doc.claimNumber);
      const claimCore = extractClaimCore(doc.claimNumber);

      console.log(`\nChecking document:`, {
        name: doc.patientName,
        claim: doc.claimNumber,
        normalized: normalizedClaim,
        core: claimCore,
      });

      // Check if this claim is related to any other claims we've seen
      let foundRelated = false;

      for (const otherDoc of matchingNameDocuments) {
        if (doc.id === otherDoc.id) continue;

        const hasCommonSequence = haveCommonClaimSequence(
          doc.claimNumber,
          otherDoc.claimNumber
        );

        if (hasCommonSequence) {
          console.log(`  ✓ Found related claim:`, {
            otherClaim: otherDoc.claimNumber,
            otherNormalized: normalizeClaimNumber(otherDoc.claimNumber),
            otherCore: extractClaimCore(otherDoc.claimNumber),
          });

          foundRelated = true;

          // Add both documents to duplicates
          if (!duplicates.find((d) => d.id === doc.id)) {
            duplicates.push(doc);
          }
          if (!duplicates.find((d) => d.id === otherDoc.id)) {
            duplicates.push(otherDoc);
          }
        }
      }

      if (!foundRelated) {
        console.log(`  ✗ No related claims found`);
      }
    }

    console.log(`\n✅ Total duplicates found: ${duplicates.length}`);

    // Sort by creation date
    duplicates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Return the duplicates
    const result = duplicates.map((doc) => ({
      id: doc.id,
      patientName: doc.patientName,
      dob: doc.dob,
      doi: doc.doi,
      claimNumber: doc.claimNumber,
      createdAt: doc.createdAt,
      fileName: doc.fileName,
      gcsFileLink: doc.gcsFileLink,
      blobPath: doc.blobPath,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching duplicate patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch duplicate patients" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
