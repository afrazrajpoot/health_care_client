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

    const body = await request.json();
    console.log('Received PATCH body:', body);

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
    if ('status' in body) {
      data.status = body.status;
    }

    // Handle assignee update
    if ('assignee' in body) {
      data.assignee = body.assignee;
    }

    // ✅ Handle UR denial reason update - direct assignment
    if ('ur_denial_reason' in body) {
      data.ur_denial_reason = body.ur_denial_reason;
    }

    // Get existing quickNotes or default empty object
    const existingQuickNotes = (existingTask.quickNotes as any) || {};

    // Handle quickNotes update - MULTIPLE FORMATS SUPPORTED
    let newQuickNotesData = null;
    let hasQuickNotesUpdate = false;

    // Determine which payload format we're dealing with
    if (body.quickNotes) {
      // Format 1: { quickNotes: { options: [...], timestamp: "..." } }
      newQuickNotesData = body.quickNotes;
      hasQuickNotesUpdate = true;
    } else if (body.options !== undefined || body.category !== undefined) {
      // Format 2: { options: [...] } or { category: "...", options: [...] }
      newQuickNotesData = {
        options: body.options || [],
        category: body.category || existingQuickNotes.category,
        timestamp: new Date().toISOString()
      };
      hasQuickNotesUpdate = true;
    } else if (body.status_update !== undefined || body.details !== undefined || body.one_line_note !== undefined) {
      // Format 3: Old text-based format
      newQuickNotesData = {
        status_update: body.status_update || existingQuickNotes.status_update,
        details: body.details || existingQuickNotes.details,
        one_line_note: body.one_line_note || existingQuickNotes.one_line_note,
        timestamp: new Date().toISOString()
      };
      hasQuickNotesUpdate = true;
    } else if ('description' in body || 'details' in body || 'notes' in body) {
      // Format 4: Text updates from first handler
      const textToSummarize =
        body.one_line_note ||
        body.details ||
        body.status_update ||
        body.description ||
        body.details ||
        body.notes ||
        "";

      const directNote = body.one_line_note || textToSummarize || "";

      newQuickNotesData = {
        ...existingQuickNotes,
        one_line_note: directNote,
        timestamp: new Date().toISOString(),
      };
      hasQuickNotesUpdate = true;
    }

    // If we have quickNotes data to update
    if (hasQuickNotesUpdate && newQuickNotesData) {
      const updatedQuickNotes = {
        // Keep existing fields
        ...existingQuickNotes,
        // Override with new quickNotes data
        ...newQuickNotesData,
        // Ensure timestamp is always updated
        timestamp: newQuickNotesData.timestamp || new Date().toISOString(),
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