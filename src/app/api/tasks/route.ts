// pages/api/tasks/index.ts or app/api/tasks/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
import { authOptions } from "@/services/authSErvice";
import { prisma } from "@/lib/prisma";

// For App Router (app/api/tasks/route.ts)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const physicianId = session.user.physicianId;

    const tasks = await prisma.task.findMany({
      where: {
        physicianId: physicianId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        document: true, // if you want to include related document data
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}