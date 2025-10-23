import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/prisma';
import { authOptions } from '@/services/authSErvice';

export async function POST(request: NextRequest) {
  try {
    // 🔐 Get authenticated user session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { description, department, patient, dueDate, status, actions, documentId, mode } = body;

    // ✅ Validate required fields
    if (!description || !department || !patient) {
      return NextResponse.json(
        { error: 'Missing required fields: description, department, patient' },
        { status: 400 }
      );
    }

    // ✅ Build task data
    const taskData = {
      description,
      department,
      patient,
      status:  'Pending',
      actions: actions || ['Claim', 'Complete'],
      dueDate: dueDate ? new Date(dueDate) : null,
      documentId: documentId || null,
      physicianId: session.user.id, // 👈 Save logged-in physician ID
    };

    // ✅ Create task in DB
    const task = await prisma.task.create({
      data: taskData,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
