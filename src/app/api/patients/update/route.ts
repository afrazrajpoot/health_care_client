import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, ensurePrismaConnection } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { originalPatient, updatedData } = body;

    if (!originalPatient || !updatedData) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    // Find documents matching the patient
    // Update all documents for this patient to maintain consistency
    const documents = await prisma.document.findMany({
      where: {
        patientName: originalPatient.patientName,
        dob: originalPatient.dob,
      },
    });

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Update all documents for this patient
    const updatePromises = documents.map((doc) =>
      prisma.document.update({
        where: {
          id: doc.id,
        },
        data: {
          patientName: updatedData.patientName || doc.patientName,
          dob: updatedData.dob || doc.dob,
          doi: updatedData.doi || doc.doi,
          claimNumber: updatedData.claimNumber || doc.claimNumber,
        },
      })
    );

    const updatedDocuments = await Promise.all(updatePromises);

    return NextResponse.json(
      {
        success: true,
        message: "Patient details updated successfully",
        updatedCount: updatedDocuments.length,
        patient: {
          patientName: updatedData.patientName,
          dob: updatedData.dob,
          doi: updatedData.doi,
          claimNumber: updatedData.claimNumber,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      {
        error: "Failed to update patient",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
