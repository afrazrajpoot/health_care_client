// app/api/patient-intake-update/route.ts
import { prisma, ensurePrismaConnection } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Ensure Prisma is connected before use
    await ensurePrismaConnection();

    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName") || searchParams.get("patient_name");
    const dob = searchParams.get("dob");
    const claimNumber = searchParams.get("claimNumber") || searchParams.get("claim_number");

    if (!patientName) {
      return NextResponse.json(
        { error: "Patient Name is required" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      patientName: {
        equals: patientName,
        mode: "insensitive",
      },
    };

    if (dob) {
      // Handle DOB matching - extract date part only
      const dobDate = dob.split("T")[0];
      whereClause.dob = dobDate;
    }

    if (claimNumber && claimNumber !== "Not specified") {
      whereClause.claimNumber = claimNumber;
    }

    // Get the most recent PatientIntakeUpdate for this patient
    const intakeUpdate = await prisma.patientIntakeUpdate.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          select: {
            id: true,
            patientName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!intakeUpdate) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No intake updates found for this patient",
      });
    }

    return NextResponse.json({
      success: true,
      data: intakeUpdate,
    });
  } catch (error) {
    console.error("Error fetching patient intake update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
  // Note: Do NOT call prisma.$disconnect() here as it causes issues with concurrent requests
}

