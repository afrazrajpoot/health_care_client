// app/api/tasks/[id]/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/services/authSErvice";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const taskId = params.id;

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let physicianId;
    if (session.user.role == "Physician") {
      physicianId = session.user.id;
    } else {
      physicianId = session.user.physicianId;
    }

    // Get the request body which contains quickNotes object
    const body = await request.json();

    // Extract quickNotes from the request body
    const { quickNotes } = body;

    // Validate that quickNotes exists
    if (!quickNotes) {
      return NextResponse.json(
        { error: "quickNotes is required in request body" },
        { status: 400 }
      );
    }

    // Validate task ownership
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        physicianId: physicianId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get existing quickNotes or default empty object
    const existingQuickNotes = (existingTask.quickNotes as any) || {};

    // Update task with the new quickNotes structure
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        quickNotes: {
          // Keep existing fields
          ...existingQuickNotes,
          // Override with new quickNotes data (options and timestamp)
          ...quickNotes,
          // Ensure timestamp is updated (in case client didn't send it)
          timestamp: quickNotes.timestamp || new Date().toISOString(),
        }
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task quickNotes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}