// app/api/documents/recent/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/authSErvice";

const prisma = new PrismaClient();

// Remove spaces + dashes + lowercase
function normalizeText(text: string): string {
  return text.replace(/[\s-]/g, "").toLowerCase().trim();
}

// Normalize names + handle name swapping
function normalizePatientName(patientName: string): string {
  if (!patientName) return "";

  const cleaned = patientName.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");

  if (parts.length <= 1) {
    return normalizeText(cleaned);
  }

  if (parts.length === 2) {
    const [a, b] = parts;
    const combos = [normalizeText(`${a} ${b}`), normalizeText(`${b} ${a}`)];
    return combos.sort()[0];
  }

  return normalizeText(cleaned);
}

// Normalize DOB to YYYYMMDD
function normalizeDOB(dob: Date | string | null): string {
  if (!dob) return "";
  try {
    const d = new Date(dob);
    return d.toISOString().split("T")[0].replace(/-/g, "");
  } catch {
    return String(dob).replace(/[\s-]/g, "");
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

    // Prisma filter only handles obvious invalid names
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

    // JS cleanup for remaining invalid names
    const cleanedDocuments = documents.filter((doc) => {
      const name = (doc.patientName || "").trim().toLowerCase();

      return (
        name &&
        name !== "Not specified" &&
        name !== "undefined" &&
        name !== "n/a" &&
        name !== "na"
      );
    });

    // Deduplication
    const uniqueDocuments = [];
    const seen = new Set();

    for (const doc of cleanedDocuments) {
      const normalizedName = normalizePatientName(doc.patientName || "");
      const normalizedClaim = normalizeText(doc.claimNumber || "");

      // Dedupe only by (name + claim number)
      const key = `${normalizedName}_${normalizedClaim}`;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueDocuments.push(doc);
      }
    }

    // Latest 10
    const recentDocuments = uniqueDocuments.slice(0, 10).map((doc) => ({
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
