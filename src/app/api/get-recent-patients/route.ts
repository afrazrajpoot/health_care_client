// app/api/documents/recent/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/authSErvice";

const prisma = new PrismaClient();

export async function GET() {
  try {
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

    const documents = await prisma.document.findMany({
      select: {
        patientName: true,
        dob: true,
        claimNumber: true,
        createdAt: true,
      },
      where: {
        physicianId: physicianId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // ✅ Remove duplicates by combination of patientName + dob + claimNumber
    const uniqueDocuments = [];
    const seen = new Set();

    for (const doc of documents) {
      const key = `${doc.patientName}_${doc.dob}_${doc.claimNumber}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDocuments.push(doc);
      }
    }

    // Limit to latest 10 after filtering
    const recentDocuments = uniqueDocuments.slice(0, 10);

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
