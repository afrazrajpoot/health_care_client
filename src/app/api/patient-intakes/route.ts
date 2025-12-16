// app/api/patient-intakes/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName");
    const dob = searchParams.get("dob");
    const claimNumber = searchParams.get("claimNumber");

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

    const submissions = await prisma.patientQuiz.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: submissions,
      total: submissions.length,
    });
  } catch (error) {
    console.error("Error fetching patient intakes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
