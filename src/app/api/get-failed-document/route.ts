// app/api/failed-documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma, ensurePrismaConnection } from "@/lib/prisma";
import { authOptions } from "@/services/authSErvice";

export async function GET(request: NextRequest) {
  try {
    // Ensure Prisma is connected before use
    await ensurePrismaConnection();

    const session = await getServerSession(authOptions);
    console.log("Full session:", session);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: No valid session" },
        { status: 401 }
      );
    }

    // Debug: Log all user properties
    console.log("User object:", session.user);
    console.log("User role:", session.user?.role);
    console.log("User ID:", session.user?.id);
    console.log("Physician ID:", session.user?.physicianId);

    // Determine which ID to use based on your business logic
    let queryId;

    if (session.user?.role === 'Physician' && session.user?.physicianId) {
      // If user is a physician AND has a physicianId, use the USER ID
      queryId = session.user.id;
      console.log("Using USER ID (Physician with physicianId):", queryId);
    } else if (session.user?.role === 'Physician') {
      // If user is a physician but doesn't have physicianId, use user ID
      queryId = session.user.id;
      console.log("Using USER ID (Physician without physicianId):", queryId);
    } else if (session.user?.physicianId) {
      // If user is not a physician but has physicianId, use physicianId
      queryId = session.user.physicianId;
      console.log("Using PHYSICIAN ID (Non-physician):", queryId);
    } else {
      // Fallback to user ID
      queryId = session.user.id;
      console.log("Using USER ID (Fallback):", queryId);
    }

    if (!queryId) {
      return NextResponse.json(
        { error: "No valid ID found for query" },
        { status: 400 }
      );
    }

    // Get first 10 records, ordered by most recent
    const [failedDocs, totalCount] = await Promise.all([
      prisma.failDocs.findMany({
        where: {
          physicianId: queryId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10, // Limit to first 10 records
      }),
      prisma.failDocs.count({
        where: {
          physicianId: queryId,
        },
      }),
    ]);

    console.log("Query ID used:", queryId);
    console.log("Failed docs found:", failedDocs.length);

    if (!failedDocs || failedDocs.length === 0) {
      return NextResponse.json(
        {
          message: "No failed documents found",
          data: [],
          totalDocuments: 0,
          queryIdUsed: queryId
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      totalDocuments: totalCount,
      documents: failedDocs,
      queryIdUsed: queryId
    });
  } catch (error) {
    console.error("Error fetching failed documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}