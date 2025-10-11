// app/api/failed-documents/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/services/authSErvice';
import { prisma } from '@/lib/prisma';




export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid session' },
        { status: 401 }
      );
    }

    const physicianId = session?.user?.physicianId; // Assuming session.user.id is the physicianId; adjust if needed (e.g., session.user.physicianId)
    console.log('Physician ID from session:',  session?.user?.physicianId);
    if (!physicianId) {
      return NextResponse.json(
        { error: 'Physician ID not found in session' },
        { status: 400 }
      );
    }

    const documents = await prisma.document.findMany({
      where: {
        physicianId: physicianId,
        OR: [
          { status: 'failed' },
          { claimNumber: 'Not specified' }
        ]
      },
      include: {
        summarySnapshot: true,
        adl: true,
        documentSummary: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { message: 'No failed or unspecified documents found', data: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      totalDocuments: documents.length,
      documents,
    });
  } catch (error) {
    console.error('Error fetching failed documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}