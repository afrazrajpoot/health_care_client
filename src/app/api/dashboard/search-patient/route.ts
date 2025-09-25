import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '@/services/authSErvice';
// import { authOptions } from "@/lib/auth"; // ⚠️ adjust the path if needed

export async function GET(request: Request) {
  try {
    // ✅ Get current user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // ✅ Extract search param
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get('patientName');

    if (!patientName) {
      return NextResponse.json(
        { error: 'Patient name is required' },
        { status: 400 }
      );
    }

    // ✅ Fetch documents with related alerts
    const documents = await prisma.document.findMany({
      where: {
        patientName: {
          contains: patientName,
          mode: 'insensitive',
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

    // ✅ Save audit log for this request
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        action: `Viewed documents and alerts for patient: ${patientName}`,
        path: '/api/documents',
        method: 'GET',
      },
    });

    // ✅ Return result
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
