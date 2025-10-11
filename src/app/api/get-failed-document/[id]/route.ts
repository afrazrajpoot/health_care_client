// app/api/documents/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';




export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { patientName, claimNumber, dob, doi } = body;

    // Validation
    if (!patientName && !claimNumber && dob === undefined && !doi) {
      return NextResponse.json({ error: 'At least one field must be provided' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    if (patientName !== undefined) updateData.patientName = patientName;
    if (claimNumber !== undefined) updateData.claimNumber = claimNumber;
    if (doi !== undefined) updateData.doi = doi;

    // Handle DOB: Since it's a String in schema, accept as YYYY-MM-DD string or full ISO; store as YYYY-MM-DD
    if (dob !== undefined) {
      let dobStr: string | null = null;
      if (dob && typeof dob === 'string') {
        // If full ISO, extract date part
        if (dob.includes('T')) {
          dobStr = dob.split('T')[0]; // e.g., "2000-12-26T00:00:00.000Z" -> "2000-12-26"
        } else {
          dobStr = dob;
        }
        // Validate it's YYYY-MM-DD
        if (dobStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          try {
            const date = new Date(dobStr + 'T00:00:00');
            if (!isNaN(date.getTime())) {
              updateData.dob = dobStr; // Store as YYYY-MM-DD string
            } else {
              return NextResponse.json({ error: 'Invalid DOB format. Use YYYY-MM-DD' }, { status: 400 });
            }
          } catch (error) {
            return NextResponse.json({ error: 'Invalid DOB format. Use YYYY-MM-DD' }, { status: 400 });
          }
        } else {
          return NextResponse.json({ error: 'Invalid DOB format. Use YYYY-MM-DD' }, { status: 400 });
        }
      } else {
        updateData.dob = null; // Explicitly set to null if falsy
      }
    }

    // Set status to 'updated'
    updateData.status = 'updated';

    // Update in DB
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      document: {
        id: updatedDocument.id,
        patientName: updatedDocument.patientName,
        claimNumber: updatedDocument.claimNumber,
        dob: updatedDocument.dob, // Return as string
        doi: updatedDocument.doi,
        status: updatedDocument.status,
        updatedAt: updatedDocument.updatedAt,
      } 
    });

  } catch (error) {
    console.error('Update document error:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}