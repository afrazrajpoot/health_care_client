import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patient_name = searchParams.get('patient_name');
    const dob = searchParams.get('dob');
    const doi = searchParams.get('doi');

    if (!patient_name) {
      return NextResponse.json(
        { error: 'Missing required parameter: patient_name' },
        { status: 400 }
      );
    }

    // ✅ Update ALL documents with this patient name
    const result = await prisma.document.updateMany({
      where: {
        patientName: patient_name,
        // If you also want to filter by dob and doi, uncomment below:
        // dob: new Date(dob),
        // doi: new Date(doi),
      },
      data: {
        status: 'verified',
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'No documents found for the provided patient name' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} document(s) verified successfully.`,
    });
  } catch (error) {
    console.error('Error verifying documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
