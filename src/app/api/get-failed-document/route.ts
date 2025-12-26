// app/api/failed-documents/route.ts
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
// import { authOptions } from '@/services/authService';
import { prisma, ensurePrismaConnection } from "@/lib/prisma";
import { authOptions } from "@/services/authSErvice";

export async function GET(request: NextRequest) {
  try {
    // Ensure Prisma is connected before use
    await ensurePrismaConnection();

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: No valid session" },
        { status: 401 }
      );
    }

    const physicianId = session?.user?.physicianId || session?.user?.id; // Assuming session.user.physicianId is available

    if (!physicianId) {
      return NextResponse.json(
        { error: "Physician ID not found in session" },
        { status: 400 }
      );
    }

    // Get first 10 records, ordered by most recent
    const [failedDocs, totalCount] = await Promise.all([
      prisma.failDocs.findMany({
        where: {
          physicianId: physicianId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10, // Limit to first 10 records
      }),
      prisma.failDocs.count({
        where: {
          physicianId: physicianId,
        },
      }),
    ]);

    if (!failedDocs || failedDocs.length === 0) {
      return NextResponse.json(
        { message: "No failed documents found", data: [], totalDocuments: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json({
      totalDocuments: totalCount,
      documents: failedDocs,
    });
  } catch (error) {
    console.error("Error fetching failed documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
  // Note: Do NOT call prisma.$disconnect() here as it causes issues with concurrent requests
}
