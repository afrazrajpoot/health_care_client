// app/api/failed-documents/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/services/authService';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/services/authSErvice';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid session' },
        { status: 401 }
      );
    }

    const physicianId = session?.user?.physicianId; // Assuming session.user.physicianId is available

    if (!physicianId) {
      return NextResponse.json(
        { error: 'Physician ID not found in session' },
        { status: 400 }
      );
    }

    const failedDocs = await prisma.failDocs.findMany({
      where: {
        physicianId: physicianId,
      },
    
    });

    if (!failedDocs || failedDocs.length === 0) {
      return NextResponse.json(
        { message: 'No failed documents found', data: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      totalDocuments: failedDocs.length,
      documents: failedDocs,
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