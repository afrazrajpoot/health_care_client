// app/api/tasks/[id]/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/services/authSErvice";


export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const updates = await request.json();

    // Validate that the task belongs to the user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        physicianId: session.user.physicianId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updates,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}