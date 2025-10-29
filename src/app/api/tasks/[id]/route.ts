// app/api/tasks/[id]/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/services/authSErvice";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ FIX 1: Await the params first
    const params = await context.params;
    const taskId = params.id;
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX 2: Check if physicianId exists in session
    if (!session.user.physicianId) {
      return NextResponse.json(
        { error: "Physician ID not found in session" }, 
        { status: 403 }
      );
    }

    const updates = await request.json();

    // 🩺 Validate that the task belongs to the logged-in physician
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        physicianId: session.user.physicianId,
      },
    });

    if (!existingTask) {
      console.log(`Task ${taskId} not found for physician ${session.user.physicianId}`);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 🧠 Prepare note text for AI summarization
    const quickNotes = updates.quickNotes || {};
    const textToSummarize =
      quickNotes.one_line_note ||
      quickNotes.details ||
      quickNotes.status_update ||
      updates.description ||
      updates.details ||
      updates.notes;

    let aiSummary = quickNotes.one_line_note || "";

    if (textToSummarize) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful clinical assistant. Summarize the note into one professional and concise sentence. should be very concise but clear meaningful no more than 20 words.",
            },
            {
              role: "user",
              content: textToSummarize,
            },
          ],
        });

        aiSummary = completion.choices[0].message.content?.trim() || aiSummary;
      } catch (err) {
        console.error("AI summarization failed:", err);
      }
    }

    // 📝 Update only quickNotes (keep existing structure)
    const updatedQuickNotes = {
      ...existingTask.quickNotes,
      ...quickNotes,
      one_line_note: aiSummary, // ✅ Save AI summary inside quickNotes
      timestamp: new Date().toISOString(),
    };

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        quickNotes: updatedQuickNotes,
      },
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