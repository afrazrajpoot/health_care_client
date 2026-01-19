import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authSErvice";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get("date"); // Optional date filter (YYYY-MM-DD)

    let whereClause = {};

    // If date filter is provided, filter for that specific date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause = {
        date: {
          gte: filterDate,
          lt: nextDay,
        },
      };
    } else {
      // Default: get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      whereClause = {
        date: {
          gte: today,
          lt: tomorrow,
        },
      };
    }

    // Fetch WorkflowStats from database
    const workflowStats = await prisma.workflowStats.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    // If no stats found for the specified date, return zeros
    const stats = workflowStats || {
      id: null,
      date: new Date(),
      referralsProcessed: 0,
      rfasMonitored: 0,
      qmeUpcoming: 0,
      payerDisputes: 0,
      externalDocs: 0,
      intakes_created: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Format the response to match the expected structure
    const response = {
      success: true,
      data: {
        stats,
        labels: [
          "Referrals Processed",
          "RFAs Monitored",
          "QME Upcoming",
          "Payer Disputes",
          "External Docs",
          "Intakes Created",
        ],
        vals: [
          stats.referralsProcessed,
          stats.rfasMonitored,
          stats.qmeUpcoming,
          stats.payerDisputes,
          stats.externalDocs,
          stats.intakes_created,
        ],
        date: stats.date,
        hasData: !!workflowStats,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching workflow stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
