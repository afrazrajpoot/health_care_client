// app/api/tasks/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/services/authSErvice";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    let physicianId: string | null = null;

    // 🧠 Determine physicianId based on role
    if (user.role === "Physician") {
      physicianId = user.id;
    } else if (user.role === "Staff") {
      physicianId = user.physicianId;
    } else {
      return NextResponse.json(
        { error: "Access denied: Invalid role" },
        { status: 403 }
      );
    }

    if (!physicianId) {
      return NextResponse.json(
        { error: "Physician ID not found for this user" },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'wc';
    const claim = searchParams.get('claim');

    // Build where clause
    const whereClause: any = { physicianId };

    if (claim) {
      whereClause.document = {
        claimNumber: claim,
      };
    }

    if (mode) {
      whereClause.document = {
        ...(whereClause.document || {}),
        mode,
      };
    }

    // ✅ Fetch tasks with their related document info
    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          select: {
            id: true,
            patientName: true,
            claimNumber: true,
            status: true,
            ur_denial_reason: true, // 🧩 Include this field
          },
        },
      },
    });

    // 🧠 Attach `ur_denial_reason` directly to each task for easy frontend access
    const tasksWithUR = tasks.map((task:any) => ({
      ...task,
      ur_denial_reason: task.document?.ur_denial_reason || null,
    }));

    return NextResponse.json(tasksWithUR);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}