import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-fallback-secret-for-development-only";

interface TokenPayload {
  patient: string;
  dob: string;
  visit: string;
  lang: string;
  mode: string;
  body: string;
  exp: number;
  auth: string;
  createdAt: string;
  claimNumber?: string;
  physicianId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      patient,
      dob,
      claim_number = "",
      visit = "Follow-up",
      lang = "en",
      mode = "tele",
      body: bodyParts = "",
      exp = "7",
      auth = "yes",
      physicianId,
    } = body;

    // Validate required fields
    if (!patient?.trim() || !dob?.trim()) {
      return NextResponse.json(
        { error: "Patient name and date of birth are required" },
        { status: 400 }
      );
    }

    // Validate date format
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format for date of birth" },
        { status: 400 }
      );
    }

    // Calculate expiration timestamp (in seconds)
    const expiresInDays = parseInt(exp) || 7;
    const expirationTime =
      Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;

    const payload: TokenPayload = {
      patient: patient.trim(),
      dob,
      claimNumber: claim_number || "",
      visit,
      lang,
      mode,
      body: bodyParts,
      exp: expirationTime,
      auth,
      createdAt: new Date().toISOString(),
      physicianId,
    };

    // Generate token
    const token = jwt.sign(payload, JWT_SECRET);

    // If it's a new patient, create a placeholder document
    if (visit === "New Patient") {
      try {
        const existingDoc = await prisma.document.findFirst({
          where: {
            patientName: patient.trim(),
            dob: dob,
            claimNumber: claim_number || "Not specified",
          },
        });

        if (!existingDoc) {
          await prisma.document.create({
            data: {
              patientName: patient.trim(),
              dob: dob,
              doi: new Date().toISOString().split("T")[0],
              claimNumber: claim_number || "Not specified",
              status: "Intake Pending",
              gcsFileLink: "",
              mode: mode === "office" ? "gm" : "wc",
              reportDate: new Date(),
              physicianId: physicianId || null,
            },
          });
          console.log(`Created placeholder document for new patient: ${patient.trim()}`);
        }
      } catch (docError) {
        console.error("Failed to create placeholder document:", docError);
        // Continue even if placeholder creation fails
      }
    }

    // Check if patient with same name and DOB already exists
    const existingPatient = await prisma.intakeLink.findFirst({
      where: {
        patientName: patient.trim(),
        dateOfBirth: dobDate,
      },
    });

    if (existingPatient) {
      // UPDATE existing record
      await prisma.intakeLink.update({
        where: { id: existingPatient.id },
        data: {
          token,
          claimNumber: claim_number || undefined,
          visitType: visit,
          language: lang,
          mode: mode,
          bodyParts: bodyParts,
          expiresInDays: expiresInDays,
          requireAuth: auth === "yes",
          expiresAt: new Date(expirationTime * 1000),
          updatedAt: new Date(),
        },
      });
      console.log(`Updated existing intake link for patient: ${patient.trim()}`);
    } else {
      // CREATE new record
      await prisma.intakeLink.create({
        data: {
          token,
          patientName: patient.trim(),
          dateOfBirth: dobDate,
          claimNumber: claim_number || undefined,
          visitType: visit,
          language: lang,
          mode: mode,
          bodyParts: bodyParts,
          expiresInDays: expiresInDays,
          requireAuth: auth === "yes",
          expiresAt: new Date(expirationTime * 1000),
        },
      });
      console.log(`Created new intake link for patient: ${patient.trim()}`);

      // Update WorkflowStats for intakes_created
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingStats = await prisma.workflowStats.findFirst({
          where: {
            date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        });

        if (existingStats) {
          await prisma.workflowStats.update({
            where: { id: existingStats.id },
            data: {
              intakes_created: { increment: 1 },
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.workflowStats.create({
            data: {
              date: today,
              intakes_created: 1,
            },
          });
        }
      } catch (statsError) {
        console.error("Failed to update WorkflowStats:", statsError);
      }
    }

    return NextResponse.json({
      token,
      expiresIn: `${expiresInDays} days`,
      action: existingPatient ? "updated" : "created",
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
