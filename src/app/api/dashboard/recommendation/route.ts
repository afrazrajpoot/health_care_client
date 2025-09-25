import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '@/services/authSErvice';
// import { authOptions } from "@/lib/auth"; // adjust this path

export async function GET(request: Request) {
  try {
    // ✅ Get session user
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get('patientName');

    if (!patientName) {
      return NextResponse.json(
        { error: 'Patient name is required' },
        { status: 400 }
      );
    }

    // ✅ Search documents by patient name
    const patients = await prisma.document.findMany({
      where: {
        patientName: {
          contains: patientName,
          mode: 'insensitive',
        },
      },
      select: {
        patientName: true,
      },
      distinct: ['patientName'],
    });

    // ✅ Save audit log with session user info
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        action: `Searched patients by name: ${patientName}`,
        path: '/api/patients',
        method: 'GET',
      },
    });

    if (patients.length === 0) {
      return NextResponse.json(
        { message: 'No patients found for the given name' },
        { status: 404 }
      );
    }

    const patientNames = patients.map((p: any) => p.patientName);

    return NextResponse.json({
      success: true,
      data: patientNames,
    });
  } catch (error) {
    console.error('Error fetching patient names:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
