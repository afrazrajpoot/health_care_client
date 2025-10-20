// app/api/submit-intake/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName");
    const dob = searchParams.get("dob");
    const doi = searchParams.get("doi");

    if (!patientName) {
      return NextResponse.json(
        { error: "Patient Name is required" },
        { status: 400 }
      );
    }

    const whereClause: any = { patientName };
    if (dob) {
      whereClause.dob = dob;
    }
    if (doi) {
      whereClause.doi = doi;
    }

    const submission = await prisma.patientQuiz.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientName,
      dob,
      claimNumber,
      doi,
      language,
      bodyAreas,
      newAppointments,
      refill,
      adl,
      therapies,
    } = body;

    if (!patientName || !language) {
      return NextResponse.json(
        { error: "Patient Name and Language are required" },
        { status: 400 }
      );
    }

    const submission = await prisma.patientQuiz.create({
      data: {
        patientName,
        dob,
        claimNumber: claimNumber || null,
        doi,
        lang: language,
        bodyAreas: bodyAreas || null,
        newAppointments: newAppointments || null,
        refill: refill || null,
        adl: adl || { state: "same", list: [] },
        therapies: therapies || null,
      },
    });

    const patientDocuments = await prisma.document.findMany({
      where: {
        patientName,
        dob,
        claimNumber: claimNumber || undefined,
      },
      include: {
        adl: true,
      },
    });

    if (patientDocuments.length === 0) {
      return NextResponse.json({ success: true, submission }, { status: 201 });
    }

    const latestDocument = patientDocuments
      .filter((doc: any) => doc.reportDate)
      .sort(
        (a: any, b: any) =>
          new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      )[0];

    if (!latestDocument) {
      return NextResponse.json({ success: true, submission }, { status: 201 });
    }

    // Prepare data for OpenAI prompt
    const painLevel = refill
      ? `${refill.before || "N/A"} -> ${refill.after || "N/A"}`
      : "N/A";
    const symptomTrend = adl?.state || "N/A";
    const patientSelectedADLs = adl?.list || [];
    const appointmentsAttended = newAppointments || [];
    const therapyEffects = therapies || [];

    const prompt = `
Based on the patient's intake form responses, determine which ADL activities are affected and what work restrictions apply.

Patient Information:
- Body Areas: ${bodyAreas || "N/A"}
- Language: ${language}
- Pain Level (before -> after medication): ${painLevel}
- Symptom Trend (from ADLs): ${symptomTrend}
- Patient Selected ADLs: ${JSON.stringify(patientSelectedADLs)}
- New Appointments: ${JSON.stringify(appointmentsAttended)}
- Therapies and Effects: ${JSON.stringify(therapyEffects)}

Task: Generate 2 lines based on the data above.

Line 1 Format: List affected daily activities as short phrases (e.g., "dressing, bathing, walking, climbing stairs")
Line 2 Format: List work restrictions as short phrases (e.g., "lifting heavy objects, prolonged standing, driving long distances")

Rules:
- Use ONLY short noun phrases separated by commas
- NO complete sentences, NO words like "may", "patient", "restrictions in", "unable to"
- Just list the activities/restrictions directly
- Base affected ADLs on patient selected list and symptom trend (e.g., if "better", focus on improved ones; if "worse", emphasize impacts)
- If pain is high (before > 5) or therapies show positive effects, adjust restrictions accordingly
- Include body areas in restrictions if relevant (e.g., "neck strain" for neck issues)

Example Output:
bathing, dressing, prolonged walking
lifting heavy objects, overhead reaching, repetitive bending

Output your 2 lines now:
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            'You are a medical ADL analyzer. Output exactly 2 lines with comma-separated short phrases only. Analyze the patient data provided and list: Line 1 = affected daily activities, Line 2 = work restrictions. Use direct phrases like "lifting heavy objects" not sentences like "patient cannot lift".',
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    });

    let adlsAffected = "";
    let workRestrictions = "";
    try {
      const content = completion.choices[0].message.content?.trim();
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      if (lines.length >= 2) {
        adlsAffected = lines[0];
        workRestrictions = lines[1];
      } else {
        throw new Error("Insufficient lines in response");
      }
    } catch (parseError) {
      console.error(
        "OpenAI response parse error:",
        parseError,
        "Raw content:",
        completion.choices[0].message.content
      );
      adlsAffected = "";
      workRestrictions = "";
    }

    await prisma.aDL.upsert({
      where: {
        documentId: latestDocument.id,
      },
      update: {
        adlsAffected,
        workRestrictions,
      },
      create: {
        adlsAffected,
        workRestrictions,
        documentId: latestDocument.id,
      },
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName");
    const dob = searchParams.get("dob");
    const doi = searchParams.get("doi");

    if (!patientName) {
      return NextResponse.json(
        { error: "Patient Name is required" },
        { status: 400 }
      );
    }

    const whereClause: any = { patientName };
    if (dob) {
      whereClause.dob = dob;
    }
    if (doi) {
      whereClause.doi = doi;
    }

    const existing = await prisma.patientQuiz.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { language, bodyAreas, newAppointments, refill, adl, therapies } =
      body;

    const submission = await prisma.patientQuiz.update({
      where: { id: existing.id },
      data: {
        lang: language || existing.lang,
        bodyAreas: bodyAreas || existing.bodyAreas,
        newAppointments: newAppointments || existing.newAppointments,
        refill: refill || existing.refill,
        adl: adl || existing.adl,
        therapies: therapies || existing.therapies,
      },
    });

    const patientDocuments = await prisma.document.findMany({
      where: {
        patientName,
        dob,
      },
      include: {
        adl: true,
      },
    });

    if (patientDocuments.length === 0) {
      return NextResponse.json({ success: true, submission }, { status: 200 });
    }

    const sortedDocuments = patientDocuments
      .filter((doc: any) => doc.reportDate)
      .sort(
        (a: any, b: any) =>
          new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      );

    if (sortedDocuments.length === 0) {
      return NextResponse.json({ success: true, submission }, { status: 200 });
    }

    const latestDocument = sortedDocuments[0];
    const previousAdl =
      sortedDocuments.length > 1 ? sortedDocuments[1].adl : null;
    const previousAdlText = previousAdl
      ? `Previous ADL: adlsAffected="${previousAdl.adlsAffected}", workRestrictions="${previousAdl.workRestrictions}"`
      : "No previous ADL available";

    // Prepare data for OpenAI prompt (same as POST but with previous)
    const painLevel = refill
      ? `${refill.before || "N/A"} -> ${refill.after || "N/A"}`
      : "N/A";
    const symptomTrend = adl?.state || "N/A";
    const patientSelectedADLs = adl?.list || [];
    const appointmentsAttended = newAppointments || [];
    const therapyEffects = therapies || [];

    const prompt = `
Based on the patient's current intake form responses and previous ADL data, determine updated ADL activities and work restrictions.

Current Patient Information:
- Body Areas: ${bodyAreas || "N/A"}
- Language: ${language || existing.lang}
- Pain Level (before -> after medication): ${painLevel}
- Symptom Trend (from ADLs): ${symptomTrend}
- Patient Selected ADLs: ${JSON.stringify(patientSelectedADLs)}
- New Appointments: ${JSON.stringify(appointmentsAttended)}
- Therapies and Effects: ${JSON.stringify(therapyEffects)}

${previousAdlText}

Task: Compare current data with previous ADL and generate updated 2 lines.

Line 1 Format: List affected daily activities as short phrases (e.g., "dressing, bathing, walking, climbing stairs")
Line 2 Format: List work restrictions as short phrases (e.g., "lifting heavy objects, prolonged standing, driving long distances")

Rules:
- Use ONLY short noun phrases separated by commas
- NO complete sentences, NO words like "may", "patient", "restrictions in", "unable to"
- Just list the activities/restrictions directly
- If trend is "better", consider reducing restrictions
- If trend is "worse", consider adding restrictions
- Base on therapies effects and pain changes

Example Output:
bathing, dressing, prolonged walking
lifting heavy objects, overhead reaching, repetitive bending

Output your 2 lines now:
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            'You output exactly 2 lines. Each line contains only comma-separated short noun phrases, NO complete sentences, NO verbs like "may", "face", "include". Just the restriction names directly.',
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    });

    let adlsAffected = "";
    let workRestrictions = "";
    try {
      const content = completion.choices[0].message.content?.trim();
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      if (lines.length >= 2) {
        adlsAffected = lines[0];
        workRestrictions = lines[1];
      } else {
        throw new Error("Insufficient lines in response");
      }
    } catch (parseError) {
      console.error(
        "OpenAI response parse error:",
        parseError,
        "Raw content:",
        completion.choices[0].message.content
      );
      adlsAffected = "";
      workRestrictions = "";
    }

    await prisma.aDL.upsert({
      where: {
        documentId: latestDocument.id,
      },
      update: {
        adlsAffected,
        workRestrictions,
      },
      create: {
        adlsAffected,
        workRestrictions,
        documentId: latestDocument.id,
      },
    });

    return NextResponse.json({ success: true, submission }, { status: 200 });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
