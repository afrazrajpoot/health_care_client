import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authSErvice";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { patientName, dob, doi, claimNumber } = body;

    if (!patientName?.trim()) {
      return NextResponse.json(
        { error: "Patient name is required" },
        { status: 400 }
      );
    }

    if (!claimNumber?.trim()) {
      return NextResponse.json(
        { error: "Claim number is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      patientName: patientName.trim(),
      claimNumber: claimNumber.trim(),
    };

    // Only update DOB if provided (store as ISO string)
    if (dob) {
      updateData.dob = new Date(dob).toISOString();
    }

    // Only update DOI if provided (store as ISO string)
    if (doi) {
      updateData.doi = new Date(doi).toISOString();
    }

    // Update the document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error: any) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update document" },
      { status: 500 }
    );
  }
}
