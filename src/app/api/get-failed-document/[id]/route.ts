// app/api/documents/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/authSErvice";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: No valid session" },
        { status: 401 }
      );
    }

    const physicianId = session?.user?.physicianId || session?.user?.id;

    if (!physicianId) {
      return NextResponse.json(
        { error: "Physician ID not found in session" },
        { status: 400 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // First verify the document belongs to this physician
    const document = await prisma.failDocs.findFirst({
      where: {
        id: id,
        physicianId: physicianId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the document
    await prisma.failDocs.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting failed document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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