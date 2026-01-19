import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authSErvice";
import { Prisma } from "@prisma/client";
// import { authOptions } from "@/lib/auth"; // ⚠️ adjust the path if needed

export async function GET(request: Request) {
  try {
    // ✅ Get current user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // ✅ Extract search params
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName");
    const claimNumber = searchParams.get("claimNumber");

    if (!patientName && !claimNumber) {
      return NextResponse.json(
        { error: "Either patient name or claim number is required" },
        { status: 400 }
      );
    }

    // ✅ Build search filter for OR condition
    const orConditions: Prisma.DocumentWhereInput[] = [];

    if (patientName) {
      orConditions.push({
        patientName: {
          contains: patientName,
          mode: "insensitive",
        },
      });
    }

    if (claimNumber) {
      orConditions.push({
        claimNumber: {
          contains: claimNumber,
          mode: "insensitive",
        },
      });
    }

    const whereClause: Prisma.DocumentWhereInput = {
      OR: orConditions,
    };

    // ✅ Fetch documents with related alerts
    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        alerts: {
          select: {
            id: true,
            alertType: true,
            title: true,
            date: true,
            status: true,
            description: true,
            isResolved: true,
            resolvedAt: true,
            resolvedBy: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    type DocumentWithAlerts = (typeof documents)[number];

    const normalizeActions = (
      actions: Prisma.JsonValue | null
    ): Prisma.JsonValue[] => {
      if (Array.isArray(actions)) {
        return actions;
      }

      if (actions) {
        return [actions];
      }

      return [];
    };

    const documentsWithActions = documents.map(
      (document: DocumentWithAlerts) => {
        const actions = (
          document as typeof document & { actions?: Prisma.JsonValue | null }
        ).actions;

        return {
          ...document,
          actions: normalizeActions(actions ?? null),
        };
      }
    );

    if (documents.length === 0) {
      return NextResponse.json(
        { message: "No documents found for the given search criteria" },
        { status: 404 }
      );
    }

    // ✅ Save audit log for this request
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        action: `Viewed documents and alerts for search: ${patientName ? `patient: ${patientName}` : ""
          }${patientName && claimNumber ? ", " : ""}${claimNumber ? `claim: ${claimNumber}` : ""
          }`,
        path: "/api/documents",
        method: "GET",
      },
    });

    // ✅ Return result
    return NextResponse.json({
      success: true,
      data: documentsWithActions,
    });
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
