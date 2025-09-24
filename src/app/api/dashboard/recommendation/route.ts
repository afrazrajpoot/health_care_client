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

    // Search for documents matching patient name and return only patient names
    const patients = await prisma.document.findMany({
      where: {
        patientName: {
          contains: patientName,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      select: {
        patientName: true,
      },
      distinct: ['patientName'], // Ensure unique patient names
    });

    if (patients.length === 0) {
      return NextResponse.json(
        { message: 'No patients found for the given name' },
        { status: 404 }
      );
    }

    // Extract just the patient names into an array
    const patientNames = patients.map((patient:any) => patient.patientName);

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