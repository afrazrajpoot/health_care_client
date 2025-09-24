import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get patient name from search params
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get('patientName');

    if (!patientName) {
      return NextResponse.json(
        { error: 'Patient name is required' },
        { status: 400 }
      );
    }

    // Search for documents matching patient name and include related alerts
    const documents = await prisma.document.findMany({
      where: {
        patientName: {
          contains: patientName,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      include: {
        alerts: {
          select: {
            id: true,
            alertType: true,
            title: true,
            date: true,
            status: true,
            description: true,
            isResolved: true,
            resolvedAt: true,
            resolvedBy: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (documents.length === 0) {
      return NextResponse.json(
        { message: 'No documents found for the given patient name' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}