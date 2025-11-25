// app/api/documents/recent/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/authSErvice";

const prisma = new PrismaClient();

// Helper function to normalize text (remove spaces, dashes, convert to lowercase)
function normalizeText(text: string): string {
  return text
    .replace(/[\s-]/g, '') // Remove spaces and dashes
    .toLowerCase()
    .trim();
}

// Helper function to normalize patient name and handle first/last name swapping
function normalizePatientName(patientName: string): string {
  if (!patientName) return '';
  
  // Remove extra spaces and normalize
  const cleanedName = patientName.replace(/\s+/g, ' ').trim();
  
  // Split into parts (assuming format is "FirstName LastName" or "LastName FirstName")
  const nameParts = cleanedName.split(' ');
  
  if (nameParts.length <= 1) {
    return normalizeText(cleanedName);
  }
  
  // For names with 2 parts, create both possible orders and sort alphabetically
  // This way "John Doe" and "Doe John" will be considered the same
  if (nameParts.length === 2) {
    const [part1, part2] = nameParts;
    const combinations = [
      normalizeText(`${part1} ${part2}`),
      normalizeText(`${part2} ${part1}`)
    ];
    
    // Return the alphabetically first combination for consistency
    return combinations.sort()[0];
  }
  
  // For names with more than 2 parts, just normalize (less common to swap)
  return normalizeText(cleanedName);
}

// Helper function to normalize DOB (handle different date formats)
function normalizeDOB(dob: Date | string | null): string {
  if (!dob) return '';
  
  try {
    const date = new Date(dob);
    // Format as YYYYMMDD for consistent comparison
    return date.toISOString().split('T')[0].replace(/-/g, '');
  } catch {
    return String(dob).replace(/[\s-]/g, '');
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let physicianId;
    if (session.user.role === "Physician") {
      physicianId = session.user.id;
    } else if (session.user.role === "Staff") {
      physicianId = session.user.physicianId;
    }

    const whereClause: any = {
      physicianId: physicianId,
    };

    if (mode) {
      whereClause.mode = mode;
    }

    const documents = await prisma.document.findMany({
      select: {
        id: true, // Include ID to ensure we have unique records
        patientName: true,
        dob: true,
        claimNumber: true,
        createdAt: true,
      },
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Enhanced deduplication with normalization
    const uniqueDocuments = [];
    const seen = new Set();

    for (const doc of documents) {
      // Normalize all fields for comparison
      const normalizedName = normalizePatientName(doc.patientName || '');
      const normalizedDOB = normalizeDOB(doc.dob);
      const normalizedClaimNumber = normalizeText(doc.claimNumber || '');
      
      // Create a unique key based on normalized values
      const key = `${normalizedName}_${normalizedDOB}_${normalizedClaimNumber}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDocuments.push({
          ...doc,
          // Store normalized values for debugging if needed
          _normalizedName: normalizedName,
          _normalizedDOB: normalizedDOB,
          _normalizedClaimNumber: normalizedClaimNumber,
        });
      }
    }

    // Limit to latest 10 after filtering
    const recentDocuments = uniqueDocuments.slice(0, 10).map(doc => ({
      patientName: doc.patientName,
      dob: doc.dob,
      claimNumber: doc.claimNumber,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json(recentDocuments);
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