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
    // ✅ Await the params first
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

    const updates = await request.json();

    // 🩺 Validate that the task belongs to the logged-in physician
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        physicianId: physicianId,
      },
    });

    if (!existingTask) {
      console.log(`Task ${taskId} not found for physician ${physicianId}`);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Prepare update data
    const data: any = {};

    // Handle status update
    if ('status' in updates) {
      data.status = updates.status;
    }

    // Handle assignee update
    if ('assignee' in updates) {
      data.assignee = updates.assignee;
    }

    // ✅ Handle UR denial reason update - direct assignment
    if ('ur_denial_reason' in updates) {
      data.ur_denial_reason = updates.ur_denial_reason;
    }

    // Handle quickNotes update only if relevant fields are present
    const quickNotes = updates.quickNotes || {};
    const hasQuickNotesUpdate = Object.keys(quickNotes).length > 0 ||
      ('description' in updates) ||
      ('details' in updates) ||
      ('notes' in updates) ||
      ('status_update' in updates) ||
      ('one_line_note' in updates);

    if (hasQuickNotesUpdate) {
      const textToSummarize =
        quickNotes.one_line_note ||
        quickNotes.details ||
        quickNotes.status_update ||
        updates.description ||
        updates.details ||
        updates.notes ||
        "";

      // Save notes directly without AI processing
      const directNote = quickNotes.one_line_note || textToSummarize || "";

      // 📝 Update only quickNotes (keep existing structure)
      const updatedQuickNotes = {
        ...(existingTask.quickNotes as object || {}),
        ...quickNotes,
        one_line_note: directNote, // ✅ Save notes directly
        timestamp: new Date().toISOString(),
      };

      data.quickNotes = updatedQuickNotes;
    }

    // If no data to update, return error
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data,
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